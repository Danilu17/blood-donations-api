import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Crear notificación (solo para administradores u organizadores)
  @Post()
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  // Obtener notificaciones del usuario autenticado
  @Get()
  getMyNotifications(@Req() req: any, @Query('unread') unread: string) {
    const userId = req.user.id;
    const unreadOnly = unread === 'true';
    return this.notificationsService.findForUser(userId, unreadOnly);
  }

  // Marcar una notificación como leída
  @Patch(':id/read')
  markRead(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.notificationsService.markAsRead(id, userId);
  }
}
