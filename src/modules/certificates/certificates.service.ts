// src/modules/certificates/certificates.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from './entities/certificate.entity';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { Donation } from '../donations/entities/donation.entity';
import { DonationStatus } from '../../common/enums/donation-status.enum';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private readonly certificatesRepository: Repository<Certificate>,
    @InjectRepository(Donation)
    private readonly donationsRepository: Repository<Donation>,
  ) {}

  /**
   * Crea (o reutiliza) un certificado para una donación COMPLETADA.
   * - Si ya existe un certificado para esa donación, lo devuelve.
   * - Si no existe, lo crea y sincroniza el verification_code con donation.certificate_id.
   */
  async create(createCertificateDto: CreateCertificateDto) {
    const { donation_id, verification_code } = createCertificateDto;

    const donation = await this.donationsRepository.findOne({
      where: { id: donation_id },
      relations: ['donor', 'campaign'],
    });

    if (!donation) {
      throw new NotFoundException('Donación no encontrada');
    }

    if (donation.status !== DonationStatus.COMPLETED) {
      throw new BadRequestException(
        'Solo se pueden generar certificados para donaciones completadas',
      );
    }

    // ¿Ya había certificado para esta donación?
    const existing = await this.certificatesRepository.findOne({
      where: { donation: { id: donation.id } },
    });

    if (existing) {
      return {
        message: 'Certificado ya existente para esta donación',
        data: existing,
      };
    }

    // Código de verificación: prioridad → dto > donation.certificate_id > nuevo uuid
    const finalCode = verification_code || donation.certificate_id || uuidv4();

    // Mantener sincronizado con la donación
    if (!donation.certificate_id) {
      donation.certificate_id = finalCode;
      await this.donationsRepository.save(donation);
    }

    const certificate = this.certificatesRepository.create({
      donation,
      verification_code: finalCode,
      issued_at: new Date(),
    });

    const saved = await this.certificatesRepository.save(certificate);

    return {
      message: 'Certificado generado exitosamente',
      data: saved,
    };
  }

  async findAll(): Promise<Certificate[]> {
    return await this.certificatesRepository.find({
      relations: ['donation', 'donation.donor', 'donation.campaign'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Certificate> {
    const certificate = await this.certificatesRepository.findOne({
      where: { id },
      relations: ['donation', 'donation.donor', 'donation.campaign'],
    });

    if (!certificate) {
      throw new NotFoundException('Certificado no encontrado');
    }

    return certificate;
  }

  async update(
    id: string,
    updateCertificateDto: UpdateCertificateDto,
  ): Promise<Certificate> {
    const certificate = await this.findOne(id);

    // No dejamos cambiar la donación asociada, solo el código si fuera necesario
    if (updateCertificateDto.donation_id) {
      delete updateCertificateDto.donation_id;
    }

    Object.assign(certificate, updateCertificateDto);

    // Si se cambia el verification_code, sincronizamos con la donación
    if (updateCertificateDto.verification_code) {
      certificate.verification_code = updateCertificateDto.verification_code;
      certificate.donation.certificate_id =
        updateCertificateDto.verification_code;
      await this.donationsRepository.save(certificate.donation);
    }

    return await this.certificatesRepository.save(certificate);
  }

  async remove(id: string): Promise<void> {
    const certificate = await this.findOne(id);

    // Opcional: limpiar el certificate_id de la donación
    if (certificate.donation && certificate.donation.certificate_id) {
      certificate.donation.certificate_id = null;
      await this.donationsRepository.save(certificate.donation);
    }

    await this.certificatesRepository.delete(id);
  }

  /**
   * Endpoint útil para validar un certificado por código (para QR/link público).
   */
  async verifyByCode(verificationCode: string) {
    const certificate = await this.certificatesRepository.findOne({
      where: { verification_code: verificationCode },
      relations: ['donation', 'donation.donor', 'donation.campaign'],
    });

    if (!certificate) {
      throw new NotFoundException('Certificado no encontrado');
    }

    const donation = certificate.donation;

    return {
      certificateId: certificate.id,
      verificationCode: certificate.verification_code,
      issuedAt: certificate.issued_at,
      donor: {
        id: donation.donor.id,
        name: donation.donor.name,
        bloodType: donation.donor.blood_type,
        email: donation.donor.email,
      },
      campaign: {
        id: donation.campaign.id,
        name: donation.campaign.name,
        location: donation.campaign.location,
        address: donation.campaign.address,
        date: donation.campaign.campaign_date,
      },
      donationDetails: {
        donationId: donation.id,
        scheduledDate: donation.scheduled_date,
        scheduledTime: donation.scheduled_time,
        actualDate: donation.actual_date,
        quantityMl: donation.quantity_ml,
      },
    };
  }
}
