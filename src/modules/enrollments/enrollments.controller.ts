import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { FilterEnrollmentDto } from './dto/filter-enrollment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { StandardizeResponseInterceptor } from '../../common/interceptors/standardize-response.interceptor';

@ApiTags('enrollments')
@ApiBearerAuth()
@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(
  new StandardizeResponseInterceptor({
    defaultMessage: 'Operación exitosa',
  }),
)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @Roles(UserRole.DONOR)
  @ApiOperation({ summary: 'Crear inscripción a campaña' })
  async create(
    @GetUser('id') donorId: string,
    @Body() dto: CreateEnrollmentDto,
  ) {
    return await this.enrollmentsService.create(donorId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Listar inscripciones' })
  async findAll(@Query() filters: FilterEnrollmentDto) {
    return await this.enrollmentsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver detalle de inscripción' })
  async findOne(@Param('id') id: string) {
    return await this.enrollmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.DONOR)
  @ApiOperation({ summary: 'Modificar inscripción (solo PENDING)' })
  async update(@Param('id') id: string, @Body() dto: UpdateEnrollmentDto) {
    return await this.enrollmentsService.update(id, dto);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.DONOR)
  @ApiOperation({ summary: 'Cancelar inscripción' })
  async cancel(@Param('id') id: string, @GetUser('id') donorId: string) {
    return await this.enrollmentsService.cancel(id, donorId);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Confirmar inscripción (Organizador)' })
  async confirm(@Param('id') id: string, @GetUser('id') organizerId: string) {
    return await this.enrollmentsService.confirm(id, organizerId);
  }
}
