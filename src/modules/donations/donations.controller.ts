import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { StandardizeResponseInterceptor } from '../../common/interceptors/standardize-response.interceptor';
import { HTTP_STATUS } from '../../common/constants/http-status.constant';

@ApiTags('Donations')
@Controller('donations')
@UseInterceptors(
  new StandardizeResponseInterceptor({
    defaultMessage: 'Operation completed successfully',
  }),
)
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule a blood donation' })
  @ApiResponse({
    status: HTTP_STATUS.CREATED,
    description: 'Donation scheduled successfully',
  })
  async create(@Body() createDonationDto: CreateDonationDto) {
    return await this.donationsService.create(createDonationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all donations' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Donations retrieved successfully',
  })
  async findAll() {
    return await this.donationsService.findAll();
  }

  @Get('donor/:donorId')
  @ApiOperation({ summary: 'Get donations by donor' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Donor donations retrieved successfully',
  })
  async findByDonor(@Param('donorId') donorId: string) {
    return await this.donationsService.findByDonor(donorId);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete a donation and register quantity' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Donation completed successfully',
  })
  async completeDonation(
    @Param('id') id: string,
    @Body('quantity_ml') quantity_ml: number,
  ) {
    return await this.donationsService.completeDonation(id, quantity_ml);
  }

  @Get(':id/certificate')
  @ApiOperation({ summary: 'Generate donation certificate' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Certificate generated successfully',
  })
  async generateCertificate(@Param('id') id: string) {
    return await this.donationsService.generateCertificate(id);
  }
}
