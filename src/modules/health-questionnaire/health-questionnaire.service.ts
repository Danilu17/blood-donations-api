import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthQuestionnaire } from './entities/health-questionnaire.entity';
import { User } from '../users/entities/user.entity';
import { CreateHealthQuestionnaireDto } from './dto/create-health-questionnaire.dto';
import { UpdateHealthQuestionnaireDto } from './dto/update-health-questionnaire.dto';
import { FilterHealthQuestionnaireDto } from './dto/filter-health-questionnaire.dto';
import { IPaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { EligibilityStatus } from '../../common/enums/eligibility-status.enum';

@Injectable()
export class HealthQuestionnaireService {
  constructor(
    @InjectRepository(HealthQuestionnaire)
    private readonly questionnaireRepository: Repository<HealthQuestionnaire>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(donorId: string, createDto: CreateHealthQuestionnaireDto) {
    const donor = await this.userRepository.findOne({ where: { id: donorId } });

    if (!donor) {
      throw new NotFoundException('Donante no encontrado');
    }

    const questionnaire = this.questionnaireRepository.create({
      ...createDto,
      last_donation_date: createDto.last_donation_date
        ? (new Date(createDto.last_donation_date) as any)
        : null,
      donor,
    });

    this.evaluateEligibility(questionnaire);

    const saved = await this.questionnaireRepository.save(questionnaire);

    return {
      message: 'Cuestionario completado exitosamente',
      data: saved,
    };
  }

  private evaluateEligibility(questionnaire: HealthQuestionnaire): void {
    const reasons: string[] = [];

    if (Number(questionnaire.weight_kg) < 50) {
      reasons.push('Peso inferior a 50 kg');
    }

    if (questionnaire.last_donation_date) {
      const daysSinceLastDonation = this.getDaysDifference(
        new Date(questionnaire.last_donation_date),
        new Date(),
      );

      const minDays = 56;

      if (daysSinceLastDonation < minDays) {
        reasons.push(
          `Debe esperar ${minDays - daysSinceLastDonation} días desde la última donación`,
        );
        questionnaire.next_eligible_date = this.addDays(
          new Date(questionnaire.last_donation_date),
          minDays,
        );
      }
    }

    if (questionnaire.has_chronic_disease) {
      reasons.push('Presenta enfermedad crónica - requiere evaluación médica');
    }

    if (questionnaire.had_recent_surgery) {
      reasons.push('Cirugía reciente - debe esperar 6 meses');
    }

    if (questionnaire.had_recent_tattoo_piercing) {
      reasons.push('Tatuaje/piercing reciente - debe esperar 6 meses');
    }

    if (questionnaire.is_pregnant_or_breastfeeding) {
      reasons.push('Embarazo o lactancia - no puede donar');
    }

    if (questionnaire.had_recent_travel_to_endemic_areas) {
      reasons.push('Viaje a zona endémica - requiere evaluación');
    }

    if (questionnaire.has_risky_behavior) {
      reasons.push('Comportamiento de riesgo - no apto');
    }

    if (questionnaire.had_covid_recently) {
      reasons.push('COVID-19 reciente - debe esperar 14 días');
    }

    if (questionnaire.received_vaccine_recently) {
      reasons.push('Vacuna reciente - debe esperar 7 días');
    }

    if (reasons.length === 0) {
      questionnaire.eligibility_status = EligibilityStatus.ELIGIBLE;
      questionnaire.ineligibility_reasons = null;
    } else if (
      questionnaire.has_chronic_disease ||
      questionnaire.is_taking_medication ||
      questionnaire.had_recent_travel_to_endemic_areas
    ) {
      questionnaire.eligibility_status = EligibilityStatus.REQUIRES_REVIEW;
      questionnaire.ineligibility_reasons = reasons.join('; ');
    } else {
      questionnaire.eligibility_status = EligibilityStatus.NOT_ELIGIBLE;
      questionnaire.ineligibility_reasons = reasons.join('; ');
    }
  }

  async calculateNextEligibleDate(donorId: string): Promise<Date | null> {
    const latest = await this.questionnaireRepository.findOne({
      where: { donor: { id: donorId } },
      order: { created_at: 'DESC' },
    });

    if (!latest || !latest.last_donation_date) {
      return null;
    }

    return this.addDays(new Date(latest.last_donation_date), 56);
  }

  async findAll(
    filters: FilterHealthQuestionnaireDto,
  ): Promise<IPaginatedResponse<HealthQuestionnaire>> {
    const { status, sort = 'desc', limit = 10, page = 0 } = filters;

    const query = this.questionnaireRepository
      .createQueryBuilder('questionnaire')
      .leftJoinAndSelect('questionnaire.donor', 'donor');

    if (status) {
      query.andWhere('questionnaire.eligibility_status = :status', { status });
    }

    const [data, total] = await query
      .orderBy('questionnaire.created_at', sort.toUpperCase() as 'ASC' | 'DESC')
      .skip(page * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, limit, page };
  }

  async findOne(id: string): Promise<HealthQuestionnaire> {
    const questionnaire = await this.questionnaireRepository.findOne({
      where: { id },
      relations: ['donor'],
    });

    if (!questionnaire) {
      throw new NotFoundException('Cuestionario no encontrado');
    }

    return questionnaire;
  }

  async findByDonor(donorId: string): Promise<HealthQuestionnaire[]> {
    return this.questionnaireRepository.find({
      where: { donor: { id: donorId } },
      order: { created_at: 'DESC' },
    });
  }

  async getLatestByDonor(donorId: string): Promise<HealthQuestionnaire | null> {
    return this.questionnaireRepository.findOne({
      where: { donor: { id: donorId } },
      order: { created_at: 'DESC' },
    });
  }

  async update(
    id: string,
    updateDto: UpdateHealthQuestionnaireDto,
  ): Promise<HealthQuestionnaire> {
    const questionnaire = await this.findOne(id);

    if (updateDto.last_donation_date) {
      (questionnaire as any).last_donation_date = new Date(
        updateDto.last_donation_date,
      );
    }

    Object.assign(questionnaire, {
      ...updateDto,
      last_donation_date: updateDto.last_donation_date
        ? (new Date(updateDto.last_donation_date) as any)
        : questionnaire.last_donation_date,
    });

    this.evaluateEligibility(questionnaire);

    return this.questionnaireRepository.save(questionnaire);
  }

  async remove(id: string): Promise<void> {
    const result = await this.questionnaireRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Cuestionario no encontrado');
    }
  }

  private getDaysDifference(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
