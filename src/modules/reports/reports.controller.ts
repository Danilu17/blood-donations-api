import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Solo administradores u organizadores pueden generar reportes
  @Get('campaign/:id')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  generateCampaign(@Param('id') id: string) {
    return this.reportsService.generateCampaignReport(id);
  }

  @Get('donations/summary')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  generateSummary() {
    return this.reportsService.generateDonationsSummary();
  }
}
