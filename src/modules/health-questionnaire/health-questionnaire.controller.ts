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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { HealthQuestionnaireService } from './health-questionnaire.service';
import { CreateHealthQuestionnaireDto } from './dto/create-health-questionnaire.dto';
import { UpdateHealthQuestionnaireDto } from './dto/update-health-questionnaire.dto';
import { FilterHealthQuestionnaireDto } from './dto/filter-health-questionnaire.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

import { HTTP_STATUS } from '../../common/constants/http-status.constant';

@ApiTags('health-questionnaire')
@ApiBearerAuth()
@Controller('health-questionnaire')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HealthQuestionnaireController {
  constructor(
    private readonly questionnaireService: HealthQuestionnaireService,
  ) {}

  @Post()
  @Roles(UserRole.DONOR)
  @ApiOperation({ summary: 'Completar cuestionario de elegibilidad (Donante)' })
  @ApiResponse({
    status: HTTP_STATUS.CREATED,
    description: 'Cuestionario completado',
  })
  async create(
    @GetUser('id') donorId: string,
    @Body() createDto: CreateHealthQuestionnaireDto,
  ) {
    return this.questionnaireService.create(donorId, createDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Listar cuestionarios (Admin/Organizador)' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Lista de cuestionarios',
  })
  async findAll(@Query() filters: FilterHealthQuestionnaireDto) {
    return this.questionnaireService.findAll(filters);
  }

  @Get('my-questionnaires')
  @Roles(UserRole.DONOR)
  @ApiOperation({ summary: 'Ver mis cuestionarios (Donante)' })
  @ApiResponse({ status: HTTP_STATUS.OK, description: 'Mis cuestionarios' })
  async getMyQuestionnaires(@GetUser('id') donorId: string) {
    return this.questionnaireService.findByDonor(donorId);
  }

  @Get('my-status')
  @Roles(UserRole.DONOR)
  @ApiOperation({ summary: 'Ver mi estado de elegibilidad actual' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Estado de elegibilidad',
  })
  async getMyStatus(@GetUser('id') donorId: string) {
    const latest = await this.questionnaireService.getLatestByDonor(donorId);
    return {
      message: 'Estado de elegibilidad obtenido',
      data: latest,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver detalle de cuestionario' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Detalle del cuestionario',
  })
  async findOne(@Param('id') id: string) {
    return this.questionnaireService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.DONOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar cuestionario' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Cuestionario actualizado',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateHealthQuestionnaireDto,
  ) {
    return this.questionnaireService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar cuestionario (Admin)' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Cuestionario eliminado',
  })
  async remove(@Param('id') id: string) {
    await this.questionnaireService.remove(id);
    return { message: 'Cuestionario eliminado exitosamente' };
  }
}
