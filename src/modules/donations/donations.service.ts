import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from './entities/donation.entity';
import { CreateDonationDto } from './dto/create-donation.dto';
import { UsersService } from '../users/users.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { v4 as uuidv4 } from 'uuid';
import { DonationStatus } from '../../common/enums/donation-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class DonationsService {
  constructor(
    @InjectRepository(Donation)
    private readonly donationsRepository: Repository<Donation>,
    private readonly usersService: UsersService,
    private readonly campaignsService: CampaignsService,
  ) {}

  async create(createDonationDto: CreateDonationDto): Promise<Donation> {
    const donor = await this.usersService.findOne(createDonationDto.donorId);
    const campaign = await this.campaignsService.findOne(
      createDonationDto.campaignId,
    );

    if (donor.role !== UserRole.DONOR) {
      throw new BadRequestException('Solo usuarios donantes pueden donar');
    }

    const donation = this.donationsRepository.create({
      donor,
      campaign,
      scheduled_date: createDonationDto.scheduled_date,
      scheduled_time: createDonationDto.scheduled_time,
      status: createDonationDto.status || DonationStatus.SCHEDULED,
      notes: createDonationDto.notes ?? null,
    });

    const saved = await this.donationsRepository.save(donation);
    return saved;
  }

  async findAll(): Promise<Donation[]> {
    return this.donationsRepository.find({
      relations: ['donor', 'campaign'],
      order: { scheduled_date: 'DESC' },
    });
  }

  async findByDonor(donorId: string): Promise<Donation[]> {
    return this.donationsRepository.find({
      where: { donor: { id: donorId } },
      relations: ['campaign'],
      order: { scheduled_date: 'DESC' },
    });
  }

  async completeDonation(id: string, quantity_ml: number): Promise<Donation> {
    const donation = await this.donationsRepository.findOne({
      where: { id },
      relations: ['donor', 'campaign'],
    });

    if (!donation) {
      throw new NotFoundException(`Donation with ID ${id} not found`);
    }

    if (donation.status === DonationStatus.COMPLETED) {
      throw new BadRequestException(
        'La donación ya está marcada como completa',
      );
    }

    if (!quantity_ml || quantity_ml <= 0) {
      throw new BadRequestException(
        'La cantidad en ml debe ser un número positivo',
      );
    }

    donation.status = DonationStatus.COMPLETED;
    donation.quantity_ml = quantity_ml;
    donation.actual_date = new Date().toISOString().split('T')[0];
    donation.certificate_id = uuidv4();

    const updatedDonation = await this.donationsRepository.save(donation);
    await this.usersService.updateDonationCount(donation.donor.id);

    return updatedDonation;
  }

  async generateCertificate(id: string) {
    const donation = await this.donationsRepository.findOne({
      where: { id },
      relations: ['donor', 'campaign'],
    });

    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    if (donation.status !== DonationStatus.COMPLETED) {
      throw new BadRequestException(
        'Certificate can only be generated for completed donations',
      );
    }

    return {
      message: 'Certificado generado',
      data: {
        certificateId: donation.certificate_id,
        donationId: donation.id,
        donor: {
          name: donation.donor.name,
          bloodType: donation.donor.blood_type,
          email: donation.donor.email,
        },
        campaign: {
          name: donation.campaign.name,
          location: donation.campaign.location,
          address: donation.campaign.address,
        },
        donationDetails: {
          date: donation.actual_date,
          scheduledDate: donation.scheduled_date,
          scheduledTime: donation.scheduled_time,
          quantityMl: donation.quantity_ml,
        },
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
