import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { ProposeCampaignDto } from './dto/propose-campaign.dto';
import { FilterCampaignsDto } from './dto/filter-campaigns.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { StandardizeResponseInterceptor } from '../../common/interceptors/standardize-response.interceptor';
import { HTTP_STATUS } from '../../common/constants/http-status.constant';

@ApiTags('campaigns')
@Controller('campaigns')
@UseInterceptors(
  new StandardizeResponseInterceptor({
    defaultMessage: 'Operación exitosa',
  }),
)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Crear campaña (Organizador)' })
  @ApiResponse({ status: HTTP_STATUS.CREATED, description: 'Campaña creada' })
  async create(
    @GetUser('id') organizerId: string,
    @Body() createDto: CreateCampaignDto,
  ) {
    return await this.campaignsService.create(organizerId, createDto);
  }

  @Post('propose')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BENEFICIARY)
  @ApiOperation({ summary: 'Proponer campaña (Beneficiario)' })
  @ApiResponse({
    status: HTTP_STATUS.CREATED,
    description: 'Propuesta enviada',
  })
  async propose(
    @GetUser('id') beneficiaryId: string,
    @Body() proposeDto: ProposeCampaignDto,
  ) {
    return await this.campaignsService.proposeCampaign(
      beneficiaryId,
      proposeDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar campañas (público)' })
  @ApiResponse({ status: HTTP_STATUS.OK, description: 'Lista de campañas' })
  async findAll(@Query() filters: FilterCampaignsDto) {
    return await this.campaignsService.findAll(filters);
  }

  @Get('proposed')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Ver campañas propuestas pendientes' })
  @ApiResponse({ status: HTTP_STATUS.OK, description: 'Propuestas pendientes' })
  async getProposed() {
    return await this.campaignsService.getProposedCampaigns();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver detalle de campaña' })
  @ApiResponse({ status: HTTP_STATUS.OK, description: 'Detalle de campaña' })
  async findOne(@Param('id') id: string) {
    return await this.campaignsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Editar campaña (Organizador)' })
  @ApiResponse({ status: HTTP_STATUS.OK, description: 'Campaña actualizada' })
  async update(
    @Param('id') id: string,
    @GetUser('id') organizerId: string,
    @Body() updateDto: UpdateCampaignDto,
  ) {
    return await this.campaignsService.update(id, organizerId, updateDto);
  }

  @Patch(':id/validate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Aprobar/Rechazar propuesta (Organizador)' })
  @ApiResponse({ status: HTTP_STATUS.OK, description: 'Propuesta revisada' })
  async validate(
    @Param('id') id: string,
    @GetUser('id') organizerId: string,
    @Body('approve') approve: boolean,
    @Body('rejection_reason') rejectionReason?: string,
  ) {
    return await this.campaignsService.validateProposal(
      id,
      organizerId,
      approve,
      rejectionReason,
    );
  }

  @Patch(':id/complete')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Marcar campaña como completada' })
  @ApiResponse({ status: HTTP_STATUS.OK, description: 'Campaña completada' })
  async complete(@Param('id') id: string, @GetUser('id') organizerId: string) {
    return await this.campaignsService.markAsCompleted(id, organizerId);
  }

  @Patch(':id/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Cancelar campaña' })
  @ApiResponse({ status: HTTP_STATUS.OK, description: 'Campaña cancelada' })
  async cancel(@Param('id') id: string, @GetUser('id') organizerId: string) {
    await this.campaignsService.cancel(id, organizerId);
    return { message: 'Campaña cancelada exitosamente' };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar campaña' })
  @ApiResponse({ status: HTTP_STATUS.OK, description: 'Campaña eliminada' })
  async remove(@Param('id') id: string, @GetUser('id') userId: string) {
    await this.campaignsService.remove(id, userId);
    return { message: 'Campaña eliminada exitosamente' };
  }
}
