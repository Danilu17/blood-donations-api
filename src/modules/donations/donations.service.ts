// src/modules/donations/donations.service.ts
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
import { UserRole } from 'src/common/enums/user-role.enum';

@Injectable()
export class DonationsService {
  constructor(
    @InjectRepository(Donation)
    private donationsRepository: Repository<Donation>,
    private usersService: UsersService,
    private campaignsService: CampaignsService,
  ) {}

  async create(createDonationDto: CreateDonationDto): Promise<Donation> {
    const donor = await this.usersService.findOne(createDonationDto.donorId);
    const campaign = await this.campaignsService.findOne(
      createDonationDto.campaignId,
    );

    if (donor.role !== UserRole.DONOR) {
      throw new BadRequestException(
        'Solo los donantes pueden realizar donaciones',
      );
    }

    if (campaign.current_donors >= campaign.max_donors) {
      throw new BadRequestException('Campaign is full');
    }

    const donation = this.donationsRepository.create({
      donor,
      campaign,
      scheduled_date: createDonationDto.scheduled_date,
      scheduled_time: createDonationDto.scheduled_time,
      status: createDonationDto.status || DonationStatus.SCHEDULED,
      notes: createDonationDto.notes ?? null,
    });

    const savedDonation = await this.donationsRepository.save(donation);

    await this.campaignsService.incrementDonorCount(campaign.id);

    return savedDonation;
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
    };
  }
}
