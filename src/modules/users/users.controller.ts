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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { StandardizeResponseInterceptor } from '../../common/interceptors/standardize-response.interceptor';
import { HTTP_STATUS } from '../../common/constants/http-status.constant';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(
  new StandardizeResponseInterceptor({
    defaultMessage: 'Operación exitosa',
  }),
)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear usuario (solo Admin)' })
  @ApiResponse({ status: HTTP_STATUS.CREATED, description: 'Usuario creado' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Listar usuarios con filtros' })
  @ApiResponse({ status: HTTP_STATUS.OK, description: 'Lista de usuarios' })
  async findAll(@Query() filters: FilterUsersDto) {
    return this.usersService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiResponse({ status: HTTP_STATUS.OK, description: 'Usuario encontrado' })
  @ApiResponse({
    status: HTTP_STATUS.NOT_FOUND,
    description: 'Usuario no encontrado',
  })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiResponse({ status: HTTP_STATUS.OK, description: 'Usuario actualizado' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar usuario (soft delete)' })
  @ApiResponse({ status: HTTP_STATUS.OK, description: 'Usuario eliminado' })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'Usuario eliminado exitosamente' };
  }
}
