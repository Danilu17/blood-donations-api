import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VolunteersService } from './volunteers.service';
import { CreateVolunteerDto } from './dto/create-volunteer.dto';
import { FilterVolunteersDto } from './dto/filter-volunteers.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { StandardizeResponseInterceptor } from '../../common/interceptors/standardize-response.interceptor';

@ApiTags('volunteers')
@ApiBearerAuth()
@Controller('volunteers')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(
  new StandardizeResponseInterceptor({
    defaultMessage: 'Operación exitosa',
  }),
)
export class VolunteersController {
  constructor(private readonly volunteersService: VolunteersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Convertir un usuario en voluntario' })
  async create(@Body() dto: CreateVolunteerDto) {
    return this.volunteersService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Listar voluntarios' })
  async findAll(@Query() filters: FilterVolunteersDto) {
    return this.volunteersService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener voluntario por ID' })
  async findOne(@Param('id') id: string) {
    return this.volunteersService.findOne(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover estado de voluntario' })
  async remove(@Param('id') id: string) {
    return this.volunteersService.remove(id);
  }
}
