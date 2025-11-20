import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment, EnrollmentStatus } from './entities/enrollment.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { FilterEnrollmentDto } from './dto/filter-enrollment.dto';
import { User } from '../users/entities/user.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { HealthQuestionnaire } from '../health-questionnaire/entities/health-questionnaire.entity';
import { UserRole } from '../../common/enums/user-role.enum';

/**
 * Servicio encargado de gestionar las inscripciones a campañas.
 *
 * Valida que el usuario sea donante, que tenga un cuestionario de salud
 * apto y que la campaña disponga de cupos. Si no hay cupos, el usuario
 * es colocado en lista de espera (status = waitlist).
 */
@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Campaign)
    private readonly campaignsRepo: Repository<Campaign>,
    @InjectRepository(HealthQuestionnaire)
    private readonly questionnaireRepo: Repository<HealthQuestionnaire>,
  ) {}

  // ==========================================================
  // CREATE
  // ==========================================================
  async create(donorId: string, dto: CreateEnrollmentDto) {
    const donor = await this.usersRepo.findOne({ where: { id: donorId } });
    const campaign = await this.campaignsRepo.findOne({
      where: { id: dto.campaignId },
    });

    if (!donor) throw new NotFoundException('Donante no encontrado');
    if (!campaign) throw new NotFoundException('Campaña no encontrada');

    if (donor.role !== UserRole.DONOR) {
      throw new ForbiddenException('Solo donantes pueden inscribirse');
    }

    // Verificar inscripción previa
    const existing = await this.enrollmentRepo.findOne({
      where: { donor: { id: donorId }, campaign: { id: dto.campaignId } },
    });

    if (existing) throw new BadRequestException('Ya estás inscripto');

    // Elegibilidad (último cuestionario)
    const lastQ = await this.questionnaireRepo.findOne({
      where: { donor: { id: donorId } },
      order: { created_at: 'DESC' },
    });

    if (!lastQ || lastQ.eligibility_status !== 'eligible') {
      throw new BadRequestException(
        'No estás habilitado para donar (completa tu cuestionario)',
      );
    }

    // Si no hay cupos disponibles, agregar a lista de espera
    if (campaign.current_donors >= campaign.max_donors) {
      const waitEnrollment = this.enrollmentRepo.create({
        donor,
        campaign,
        preferred_time: dto.preferred_time ?? null,
        notes: dto.notes ?? null,
        status: EnrollmentStatus.WAITLIST,
      });

      const savedWait = await this.enrollmentRepo.save(waitEnrollment);

      return {
        message: 'La campaña alcanzó el cupo máximo, quedas en lista de espera',
        data: savedWait,
      };
    }

    // Crear inscripción pendiente
    const enrollment = this.enrollmentRepo.create({
      donor,
      campaign,
      preferred_time: dto.preferred_time ?? null,
      notes: dto.notes ?? null,
      status: EnrollmentStatus.PENDING,
    });

    const saved = await this.enrollmentRepo.save(enrollment);

    // Incrementar cupo de la campaña
    await this.campaignsRepo.increment(
      { id: campaign.id },
      'current_donors',
      1,
    );

    return {
      message: 'Inscripción creada exitosamente',
      data: saved,
    };
  }

  // ==========================================================
  // LIST
  // ==========================================================
  async findAll(filters: FilterEnrollmentDto) {
    const { status, campaignId, limit, page } = filters;

    const query = this.enrollmentRepo
      .createQueryBuilder('enroll')
      .leftJoinAndSelect('enroll.donor', 'donor')
      .leftJoinAndSelect('enroll.campaign', 'campaign');

    if (status) query.andWhere('enroll.status = :status', { status });
    if (campaignId) query.andWhere('campaign.id = :campaignId', { campaignId });

    const [data, total] = await query
      .orderBy('enroll.created_at', 'DESC')
      .skip(page * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, limit, page };
  }

  // ==========================================================
  // FIND ONE
  // ==========================================================
  async findOne(id: string) {
    const enrollment = await this.enrollmentRepo.findOne({ where: { id } });
    if (!enrollment) throw new NotFoundException('Inscripción no encontrada');

    return enrollment;
  }

  // ==========================================================
  // UPDATE
  // ==========================================================
  async update(id: string, dto: UpdateEnrollmentDto) {
    const enrollment = await this.findOne(id);

    if (enrollment.status !== EnrollmentStatus.PENDING) {
      throw new BadRequestException('Solo inscripciones pendientes');
    }

    Object.assign(enrollment, dto);
    return await this.enrollmentRepo.save(enrollment);
  }

  // ==========================================================
  // CANCEL (Donor)
  // ==========================================================
  async cancel(id: string, donorId: string) {
    const enrollment = await this.findOne(id);

    if (enrollment.donor.id !== donorId) {
      throw new ForbiddenException('No puedes cancelar esta inscripción');
    }

    // Si la inscripción era confirmada o pendiente, liberar cupo
    if (
      enrollment.status === EnrollmentStatus.CONFIRMED ||
      enrollment.status === EnrollmentStatus.PENDING
    ) {
      await this.campaignsRepo.decrement(
        { id: enrollment.campaign.id },
        'current_donors',
        1,
      );
    }

    enrollment.status = EnrollmentStatus.CANCELLED;
    await this.enrollmentRepo.save(enrollment);

    return { message: 'Inscripción cancelada' };
  }

  // ==========================================================
  // CONFIRM (Organizer)
  // ==========================================================
  async confirm(id: string, organizerId: string) {
    const enrollment = await this.findOne(id);

    if (!enrollment.campaign.organizer) {
      throw new ForbiddenException('Campaña sin organizador');
    }

    if (enrollment.campaign.organizer.id !== organizerId) {
      throw new ForbiddenException(
        'No tienes permisos para confirmar inscripciones',
      );
    }

    // No permitir confirmar inscripciones en lista de espera si no hay cupo
    if (
      enrollment.status === EnrollmentStatus.WAITLIST &&
      enrollment.campaign.current_donors >= enrollment.campaign.max_donors
    ) {
      throw new BadRequestException(
        'No hay cupos disponibles para confirmar esta inscripción',
      );
    }

    if (enrollment.status === EnrollmentStatus.CONFIRMED) {
      throw new BadRequestException('La inscripción ya está confirmada');
    }

    enrollment.status = EnrollmentStatus.CONFIRMED;
    await this.enrollmentRepo.save(enrollment);

    // Si provenía de la lista de espera, ahora ocupa un lugar
    // if (enrollment.status === EnrollmentStatus.WAITLIST) {
    //   await this.campaignsRepo.increment(
    //     { id: enrollment.campaign.id },
    //     'current_donors',
    //     1,
    //   );
    // }

    return enrollment;
  }
}
