import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BloodRequestService } from './blood-requests.service';
import { CreateBloodRequestDto } from './dto/create-blood-request.dto';
import { UpdateBloodRequestDto } from './dto/update-blood-request.dto';
import { FilterBloodRequestDto } from './dto/filter-blood-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { StandardizeResponseInterceptor } from '../../common/interceptors/standardize-response.interceptor';

@ApiTags('blood-request')
@ApiBearerAuth()
@Controller('blood-request')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(
  new StandardizeResponseInterceptor({ defaultMessage: 'Operación exitosa' }),
)
export class BloodRequestController {
  constructor(private readonly service: BloodRequestService) {}

  @Post()
  @Roles(UserRole.DONOR, UserRole.BENEFICIARY)
  create(@GetUser('id') userId: string, @Body() dto: CreateBloodRequestDto) {
    return this.service.create(userId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  findAll(@Query() filters: FilterBloodRequestDto) {
    return this.service.findAll(filters);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @GetUser('id') adminId: string,
    @Body() dto: UpdateBloodRequestDto,
  ) {
    return this.service.update(id, adminId, dto);
  }
}
