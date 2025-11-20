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
import { EligibilityStatus } from '../../common/enums/eligibility-status.enum';

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

    const existing = await this.enrollmentRepo.findOne({
      where: { donor: { id: donorId }, campaign: { id: dto.campaignId } },
    });

    if (existing) throw new BadRequestException('Ya estás inscripto');

    const lastQ = await this.questionnaireRepo.findOne({
      where: { donor: { id: donorId } },
      order: { created_at: 'DESC' },
    });

    if (!lastQ || lastQ.eligibility_status !== EligibilityStatus.ELIGIBLE) {
      throw new BadRequestException(
        'No estás habilitado para donar (completa tu cuestionario)',
      );
    }

    // Verificar si hay cupos disponibles
    if (campaign.current_donors >= campaign.max_donors) {
      const waitEnrollment = this.enrollmentRepo.create({
        donor,
        campaign,
        preferred_time: dto.preferred_time ?? null,
        notes: dto.notes ?? null,
        status: EnrollmentStatus.WAITLIST,
      });

      return {
        message: 'La campaña alcanzó el cupo máximo, quedas en lista de espera',
        data: await this.enrollmentRepo.save(waitEnrollment),
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

    // Incrementar cupo
    campaign.current_donors += 1;
    await this.campaignsRepo.save(campaign);

    return {
      message: 'Inscripción creada exitosamente',
      data: saved,
    };
  }

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

  async findOne(id: string) {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id },
      relations: ['donor', 'campaign'],
    });
    if (!enrollment) throw new NotFoundException('Inscripción no encontrada');
    return enrollment;
  }

  async update(id: string, dto: UpdateEnrollmentDto) {
    const enrollment = await this.findOne(id);

    if (enrollment.status !== EnrollmentStatus.PENDING) {
      throw new BadRequestException(
        'Solo inscripciones pendientes se pueden modificar',
      );
    }

    Object.assign(enrollment, dto);
    return await this.enrollmentRepo.save(enrollment);
  }

  async cancel(id: string, donorId: string) {
    const enrollment = await this.findOne(id);

    if (enrollment.donor.id !== donorId) {
      throw new ForbiddenException('No puedes cancelar esta inscripción');
    }

    if (
      enrollment.status === EnrollmentStatus.CONFIRMED ||
      enrollment.status === EnrollmentStatus.PENDING
    ) {
      enrollment.campaign.current_donors = Math.max(
        0,
        enrollment.campaign.current_donors - 1,
      );
      await this.campaignsRepo.save(enrollment.campaign);
    }

    enrollment.status = EnrollmentStatus.CANCELLED;
    await this.enrollmentRepo.save(enrollment);

    return { message: 'Inscripción cancelada' };
  }

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

    if (
      enrollment.status === EnrollmentStatus.WAITLIST &&
      enrollment.campaign.current_donors >= enrollment.campaign.max_donors
    ) {
      throw new BadRequestException('No hay cupos disponibles para confirmar');
    }

    if (enrollment.status === EnrollmentStatus.CONFIRMED) {
      throw new BadRequestException('La inscripción ya está confirmada');
    }

    enrollment.status = EnrollmentStatus.CONFIRMED;
    return await this.enrollmentRepo.save(enrollment);
  }
}
