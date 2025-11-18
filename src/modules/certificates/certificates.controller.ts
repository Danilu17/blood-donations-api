// src/modules/certificates/certificates.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { StandardizeResponseInterceptor } from '../../common/interceptors/standardize-response.interceptor';
import { HTTP_STATUS } from '../../common/constants/http-status.constant';

@ApiTags('certificates')
@ApiBearerAuth()
@Controller('certificates')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(
  new StandardizeResponseInterceptor({
    defaultMessage: 'Operación exitosa',
  }),
)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({
    summary:
      'Crear certificado para una donación completada (Admin/Organizador)',
  })
  @ApiResponse({
    status: HTTP_STATUS.CREATED,
    description: 'Certificado creado o reutilizado correctamente',
  })
  async create(@Body() createCertificateDto: CreateCertificateDto) {
    return await this.certificatesService.create(createCertificateDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Listar todos los certificados' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Lista de certificados',
  })
  async findAll() {
    const data = await this.certificatesService.findAll();
    return { data };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Ver detalle de un certificado por ID' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Detalle del certificado',
  })
  async findOne(@Param('id') id: string) {
    return await this.certificatesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar certificado (solo Admin)' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Certificado actualizado',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCertificateDto: UpdateCertificateDto,
  ) {
    const data = await this.certificatesService.update(
      id,
      updateCertificateDto,
    );
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar certificado (solo Admin)' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Certificado eliminado',
  })
  async remove(@Param('id') id: string) {
    await this.certificatesService.remove(id);
    return { message: 'Certificado eliminado exitosamente' };
  }

  // ================= PUBLIC / VERIFICATION ===================

  @Get('verify/:code')
  @UseGuards() // sin guards → público (para validar certificado por código)
  @ApiOperation({
    summary: 'Verificar certificado por código (público, para QR/link)',
  })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Información del certificado',
  })
  async verify(@Param('code') code: string) {
    const data = await this.certificatesService.verifyByCode(code);
    return { data };
  }
}
