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
import { CentersService } from './centers.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';
import { FilterCentersDto } from './dto/filter-centers.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { StandardizeResponseInterceptor } from '../../common/interceptors/standardize-response.interceptor';

@ApiTags('centers')
@ApiBearerAuth()
@Controller('centers')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(
  new StandardizeResponseInterceptor({
    defaultMessage: 'Operación exitosa',
  }),
)
export class CentersController {
  constructor(private readonly service: CentersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Crear centro' })
  async create(@Body() dto: CreateCenterDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Listar centros con filtros' })
  async findAll(@Query() filters: FilterCentersDto) {
    return this.service.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener centro por ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Actualizar centro' })
  async update(@Param('id') id: string, @Body() dto: UpdateCenterDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activar / desactivar centro' })
  async toggle(@Param('id') id: string) {
    const data = await this.service.toggleActive(id);
    return { message: 'Estado actualizado', data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar centro' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { message: 'Centro eliminado' };
  }
}
