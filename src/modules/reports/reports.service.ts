import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { Donation } from '../donations/entities/donation.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(Donation)
    private readonly donationRepo: Repository<Donation>,
  ) {}

  /**
   * Genera un reporte de inscriptos para una campaña específica.  Devuelve
   * la data cruda y guarda un registro del reporte generado.
   */
  async generateCampaignReport(campaignId: string) {
    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId },
    });
    if (!campaign) throw new NotFoundException('Campaña no encontrada');

    // Obtener las donaciones asociadas (inscriptos)
    const donations = await this.donationRepo.find({
      where: { campaign: { id: campaignId } },
      relations: ['donor'],
    });
    const rows = donations.map((don) => ({
      nombre: don.donor.name,
      email: don.donor.email,
      grupo: don.donor.blood_type ?? '',
      estado: don.status,
      fechaRegistro: don.created_at.toISOString().split('T')[0],
    }));

    // Podrías escribir un archivo CSV/Excel aquí y guardar su URL en la entidad Report.
    const report = this.reportRepo.create({
      name: `Inscriptos campaña ${campaign.name}`,
      type: 'campaign',
      file_url: null,
    });
    await this.reportRepo.save(report);

    return { reportId: report.id, data: rows };
  }

  /**
   * Genera un resumen global de donaciones agrupado por tipo de sangre.
   */
  async generateDonationsSummary() {
    const donations = await this.donationRepo.find({ relations: ['donor'] });
    const summary: Record<string, number> = {};
    for (const don of donations) {
      const bt = don.donor.blood_type || 'N/A';
      summary[bt] = (summary[bt] || 0) + 1;
    }
    const report = this.reportRepo.create({
      name: 'Resumen global de donaciones',
      type: 'summary',
      file_url: null,
    });
    await this.reportRepo.save(report);
    return { reportId: report.id, data: summary };
  }
}
