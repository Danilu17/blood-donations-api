import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { User } from '../users/entities/user.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { ProposeCampaignDto } from './dto/propose-campaign.dto';
import { FilterCampaignsDto } from './dto/filter-campaigns.dto';
import { IPaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { CampaignStatus } from '../../common/enums/campaign-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(organizerId: string, createDto: CreateCampaignDto) {
    const organizer = await this.userRepository.findOne({
      where: { id: organizerId },
    });

    if (!organizer || organizer.role !== UserRole.ORGANIZER) {
      throw new ForbiddenException('Solo organizadores pueden crear campañas');
    }

    const campaignDate = new Date(createDto.campaign_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (campaignDate < today) {
      throw new BadRequestException('La fecha debe ser futura');
    }

    if (createDto.start_time >= createDto.end_time) {
      throw new BadRequestException(
        'La hora de inicio debe ser anterior a la de finalización',
      );
    }

    await this.validateOverlap(
      createDto.campaign_date,
      createDto.start_time,
      createDto.end_time,
      createDto.location,
    );

    const campaign = this.campaignRepository.create({
      name: (createDto as any).name ?? (createDto as any).title, // por si el DTO tiene title
      location: createDto.location,
      address: (createDto as any).address ?? createDto.location,
      campaign_date: createDto.campaign_date,
      start_time: createDto.start_time,
      end_time: createDto.end_time,
      max_donors:
        (createDto as any).max_donors ?? (createDto as any).capacity ?? 0,
      current_donors: 0,
      organizer,
      status: CampaignStatus.ACTIVE,
    });

    const saved = await this.campaignRepository.save(campaign);

    return {
      message: 'Campaña creada exitosamente',
      data: saved,
    };
  }

  async proposeCampaign(beneficiaryId: string, proposeDto: ProposeCampaignDto) {
    const beneficiary = await this.userRepository.findOne({
      where: { id: beneficiaryId },
    });

    if (!beneficiary || beneficiary.role !== UserRole.BENEFICIARY) {
      throw new ForbiddenException(
        'Solo beneficiarios pueden proponer campañas',
      );
    }

    const campaignDate = new Date(proposeDto.campaign_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (campaignDate < today) {
      throw new BadRequestException('La fecha debe ser futura');
    }

    const campaign = this.campaignRepository.create({
      name: (proposeDto as any).name ?? (proposeDto as any).title,
      location: proposeDto.location,
      address: (proposeDto as any).address ?? proposeDto.location,
      campaign_date: proposeDto.campaign_date,
      start_time: proposeDto.start_time,
      end_time: proposeDto.end_time,
      max_donors:
        (proposeDto as any).max_donors ?? (proposeDto as any).capacity ?? 0,
      current_donors: 0,
      proposed_by: beneficiary,
      status: CampaignStatus.PROPOSED,
    });

    const saved = await this.campaignRepository.save(campaign);

    return {
      message:
        'Propuesta de campaña enviada. Un organizador la revisará pronto.',
      data: saved,
    };
  }

  async validateProposal(
    campaignId: string,
    organizerId: string,
    approve: boolean,
    rejectionReason?: string,
  ) {
    const campaign = await this.findOne(campaignId);

    if (campaign.status !== CampaignStatus.PROPOSED) {
      throw new BadRequestException('Esta campaña ya fue revisada');
    }

    const organizer = await this.userRepository.findOne({
      where: { id: organizerId },
    });

    if (!organizer || organizer.role !== UserRole.ORGANIZER) {
      throw new ForbiddenException(
        'Solo organizadores pueden validar propuestas',
      );
    }

    if (approve) {
      campaign.status = CampaignStatus.ACTIVE;
      campaign.organizer = organizer;
      campaign.rejection_reason = null;
    } else {
      campaign.status = CampaignStatus.CANCELLED;
      campaign.rejection_reason = rejectionReason || 'No especificado';
    }

    const updated = await this.campaignRepository.save(campaign);

    return {
      message: approve ? 'Campaña aprobada y publicada' : 'Propuesta rechazada',
      data: updated,
    };
  }

  async findAll(
    filters: FilterCampaignsDto,
  ): Promise<IPaginatedResponse<Campaign>> {
    const {
      status,
      date_from,
      date_to,
      search,
      is_featured,
      available_only,
      sort = 'asc',
      limit = 10,
      page = 0,
    } = filters;

    const query = this.campaignRepository
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.organizer', 'organizer')
      .leftJoinAndSelect('campaign.proposed_by', 'proposed_by');

    if (status) {
      query.andWhere('campaign.status = :status', { status });
    }

    if (date_from) {
      query.andWhere('campaign.campaign_date >= :date_from', { date_from });
    }

    if (date_to) {
      query.andWhere('campaign.campaign_date <= :date_to', { date_to });
    }

    if (search) {
      query.andWhere(
        '(campaign.name LIKE :search OR campaign.location LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (is_featured !== undefined) {
      query.andWhere('campaign.is_featured = :is_featured', { is_featured });
    }

    if (available_only) {
      query.andWhere('campaign.current_donors < campaign.max_donors');
    }

    const [data, total] = await query
      .orderBy('campaign.campaign_date', sort.toUpperCase() as 'ASC' | 'DESC')
      .skip(page * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, limit, page };
  }

  async findOne(id: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: ['organizer', 'proposed_by'],
    });

    if (!campaign) {
      throw new NotFoundException('Campaña no encontrada');
    }

    return campaign;
  }

  async update(
    id: string,
    organizerId: string,
    updateDto: UpdateCampaignDto,
  ): Promise<Campaign> {
    const campaign = await this.findOne(id);

    if (!campaign.organizer || campaign.organizer.id !== organizerId) {
      throw new ForbiddenException(
        'Solo el organizador de esta campaña puede editarla',
      );
    }

    if (campaign.status === CampaignStatus.COMPLETED) {
      throw new BadRequestException(
        'No se puede editar una campaña completada',
      );
    }

    if (updateDto.campaign_date) {
      const newDate = new Date(updateDto.campaign_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (newDate < today) {
        throw new BadRequestException('La nueva fecha debe ser futura');
      }
    }

    const startTime = updateDto.start_time || campaign.start_time;
    const endTime = updateDto.end_time || campaign.end_time;

    if (startTime >= endTime) {
      throw new BadRequestException(
        'La hora de inicio debe ser anterior a la de finalización',
      );
    }

    Object.assign(campaign, updateDto);

    return this.campaignRepository.save(campaign);
  }

  async cancel(id: string, organizerId: string): Promise<void> {
    const campaign = await this.findOne(id);

    if (!campaign.organizer || campaign.organizer.id !== organizerId) {
      throw new ForbiddenException(
        'Solo el organizador puede cancelar esta campaña',
      );
    }

    if (campaign.status === CampaignStatus.COMPLETED) {
      throw new BadRequestException(
        'No se puede cancelar una campaña completada',
      );
    }

    campaign.status = CampaignStatus.CANCELLED;
    await this.campaignRepository.save(campaign);

    // TODO: Notificar a inscritos
  }

  async remove(id: string, userId: string): Promise<void> {
    const campaign = await this.findOne(id);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ForbiddenException('Usuario no encontrado');
    }
    if (!campaign.organizer) {
      throw new ForbiddenException('La campaña no tiene organizador asignado');
    }
    if (user.role !== UserRole.ADMIN && campaign.organizer.id !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar esta campaña',
      );
    }

    await this.campaignRepository.softDelete(id);
  }

  async markAsCompleted(id: string, organizerId: string): Promise<Campaign> {
    const campaign = await this.findOne(id);

    if (!campaign.organizer || campaign.organizer.id !== organizerId) {
      throw new ForbiddenException(
        'Solo el organizador puede completar esta campaña',
      );
    }

    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestException(
        'Solo se pueden completar campañas activas',
      );
    }

    campaign.status = CampaignStatus.COMPLETED;
    return this.campaignRepository.save(campaign);
  }

  async getProposedCampaigns(): Promise<Campaign[]> {
    return this.campaignRepository.find({
      where: { status: CampaignStatus.PROPOSED },
      relations: ['proposed_by'],
      order: { created_at: 'DESC' },
    });
  }

  private async validateOverlap(
    date: string,
    startTime: string,
    endTime: string,
    location: string,
  ): Promise<void> {
    const overlapping = await this.campaignRepository
      .createQueryBuilder('campaign')
      .where('campaign.campaign_date = :date', { date })
      .andWhere('campaign.location = :location', { location })
      .andWhere('campaign.status = :status', { status: CampaignStatus.ACTIVE })
      .andWhere(
        '(campaign.start_time < :endTime AND campaign.end_time > :startTime)',
        { startTime, endTime },
      )
      .getOne();

    if (overlapping) {
      throw new BadRequestException(
        'Ya existe una campaña activa en esa ubicación y horario',
      );
    }
  }

  async incrementDonorCount(id: string): Promise<void> {
    const result = await this.campaignRepository.increment(
      { id },
      'current_donors',
      1,
    );

    if (result.affected === 0) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
  }
}
