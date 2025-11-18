import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
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
import { RoleChangeService } from './role-change.service';
import { RequestRoleChangeDto } from './dto/request-role-change.dto';
import { ReviewRoleChangeDto } from './dto/review-role-change.dto';
import { FilterRoleChangeDto } from './dto/filter-role-change.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { StandardizeResponseInterceptor } from '../../common/interceptors/standardize-response.interceptor';
import { HTTP_STATUS } from '../../common/constants/http-status.constant';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('role-change')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(
  new StandardizeResponseInterceptor({
    defaultMessage: 'Operación exitosa',
  }),
)
export class RoleChangeController {
  constructor(private readonly roleChangeService: RoleChangeService) {}

  @Post('request')
  @Roles(UserRole.DONOR, UserRole.BENEFICIARY, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Solicitar cambio de rol' })
  @ApiResponse({
    status: HTTP_STATUS.CREATED,
    description: 'Solicitud creada',
  })
  async requestRoleChange(
    @GetUser('id') userId: string,
    @Body() requestRoleChangeDto: RequestRoleChangeDto,
  ) {
    return await this.roleChangeService.requestRoleChange(
      userId,
      requestRoleChangeDto,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar todas las solicitudes (Admin)' })
  @ApiResponse({ status: HTTP_STATUS.OK, description: 'Lista de solicitudes' })
  async findAll(@Query() filters: FilterRoleChangeDto) {
    return await this.roleChangeService.findAll(filters);
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Ver mis solicitudes de cambio de rol' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Mis solicitudes',
  })
  async getMyRequests(@GetUser('id') userId: string) {
    return await this.roleChangeService.getUserRequests(userId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Ver detalle de solicitud' })
  @ApiResponse({ status: HTTP_STATUS.OK, description: 'Detalle de solicitud' })
  async findOne(@Param('id') id: string) {
    return await this.roleChangeService.findOne(id);
  }

  @Patch(':id/review')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Aprobar o rechazar solicitud (Admin)' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Solicitud revisada',
  })
  async reviewRequest(
    @Param('id') id: string,
    @GetUser('id') adminId: string,
    @Body() reviewDto: ReviewRoleChangeDto,
  ) {
    return await this.roleChangeService.reviewRequest(id, adminId, reviewDto);
  }
}
