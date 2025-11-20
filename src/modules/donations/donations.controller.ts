import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';

import { HTTP_STATUS } from '../../common/constants/http-status.constant';

@ApiTags('donations')
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  @ApiOperation({ summary: 'Programar una donación de sangre' })
  @ApiResponse({
    status: HTTP_STATUS.CREATED,
    description: 'Donación programada correctamente',
  })
  async create(@Body() createDonationDto: CreateDonationDto) {
    return this.donationsService.create(createDonationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las donaciones' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Donaciones obtenidas correctamente',
  })
  async findAll() {
    return this.donationsService.findAll();
  }

  @Get('donor/:donorId')
  @ApiOperation({ summary: 'Listar donaciones por donante' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Donaciones del donante obtenidas correctamente',
  })
  async findByDonor(@Param('donorId') donorId: string) {
    return this.donationsService.findByDonor(donorId);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Completar una donación y registrar cantidad' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Donación completada correctamente',
  })
  async completeDonation(
    @Param('id') id: string,
    @Body('quantity_ml') quantity_ml: number,
  ) {
    return this.donationsService.completeDonation(id, quantity_ml);
  }

  @Get(':id/certificate')
  @ApiOperation({ summary: 'Generar certificado de donación' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Certificado generado correctamente',
  })
  async generateCertificate(@Param('id') id: string) {
    return this.donationsService.generateCertificate(id);
  }
}
