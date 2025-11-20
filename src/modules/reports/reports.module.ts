import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Report } from './entities/report.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { Donation } from '../donations/entities/donation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, Campaign, Donation])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
