import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateNotificationDto) {
    const recipient = await this.userRepo.findOne({
      where: { id: dto.recipientId },
    });
    if (!recipient) {
      throw new NotFoundException('Usuario destinatario no encontrado');
    }
    const notification = this.notificationRepo.create({
      recipient,
      type: dto.type,
      title: dto.title,
      message: dto.message ?? null,
      data: dto.data ?? null,
      is_read: false,
    });
    const saved = await this.notificationRepo.save(notification);
    return { message: 'Notificación creada', data: saved };
  }

  async findForUser(userId: string, unreadOnly = false) {
    return this.notificationRepo.find({
      where: {
        recipient: { id: userId },
        ...(unreadOnly ? { is_read: false } : {}),
      },
      order: { created_at: 'DESC' },
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepo.findOne({
      where: { id },
      relations: ['recipient'],
    });
    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }
    if (notification.recipient.id !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar esta notificación',
      );
    }
    notification.is_read = true;
    await this.notificationRepo.save(notification);
    return { message: 'Notificación marcada como leída' };
  }
}
