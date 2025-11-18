import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleChangeRequest } from './entities/role-change-request.entity';
import { User } from '../users/entities/user.entity';
import { RequestRoleChangeDto } from './dto/request-role-change.dto';
import { ReviewRoleChangeDto } from './dto/review-role-change.dto';
import { FilterRoleChangeDto } from './dto/filter-role-change.dto';
import { IPaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { RoleChangeStatus } from '../../common/enums/role-change-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class RoleChangeService {
  constructor(
    @InjectRepository(RoleChangeRequest)
    private readonly roleChangeRepository: Repository<RoleChangeRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async requestRoleChange(
    userId: string,
    requestRoleChangeDto: RequestRoleChangeDto,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.role === requestRoleChangeDto.requested_role) {
      throw new BadRequestException('Ya tienes ese rol asignado');
    }

    if (requestRoleChangeDto.requested_role === UserRole.ADMIN) {
      throw new ForbiddenException('No puedes solicitar rol de administrador');
    }

    const existingRequest = await this.roleChangeRepository.findOne({
      where: {
        user: { id: userId },
        status: RoleChangeStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException('Ya tienes una solicitud pendiente');
    }

    const request = this.roleChangeRepository.create({
      user,
      current_role: user.role,
      requested_role: requestRoleChangeDto.requested_role,
      justification: requestRoleChangeDto.justification,
    });

    const saved = await this.roleChangeRepository.save(request);

    return {
      message: 'Solicitud de cambio de rol enviada exitosamente',
      data: saved,
    };
  }

  async findAll(
    filters: FilterRoleChangeDto,
  ): Promise<IPaginatedResponse<RoleChangeRequest>> {
    const { status, sort = 'desc', limit = 10, page = 0 } = filters;

    const query = this.roleChangeRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.user', 'user')
      .leftJoinAndSelect('request.reviewed_by', 'reviewer');

    if (status) {
      query.andWhere('request.status = :status', { status });
    }

    const [data, total] = await query
      .orderBy('request.created_at', sort.toUpperCase() as 'ASC' | 'DESC')
      .skip(page * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, limit, page };
  }

  async findOne(id: string): Promise<RoleChangeRequest> {
    const request = await this.roleChangeRepository.findOne({
      where: { id },
      relations: ['user', 'reviewed_by'],
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    return request;
  }

  async reviewRequest(
    requestId: string,
    adminId: string,
    reviewDto: ReviewRoleChangeDto,
  ) {
    const request = await this.findOne(requestId);

    if (request.status !== RoleChangeStatus.PENDING) {
      throw new BadRequestException('Esta solicitud ya fue revisada');
    }

    const admin = await this.userRepository.findOne({
      where: { id: adminId },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Solo administradores pueden revisar solicitudes',
      );
    }

    request.status = reviewDto.status;
    request.review_notes = reviewDto.review_notes;
    request.reviewed_by = admin;
    request.reviewed_at = new Date();

    if (reviewDto.status === RoleChangeStatus.APPROVED) {
      const user = await this.userRepository.findOne({
        where: { id: request.user.id },
      });

      if (user) {
        user.role = request.requested_role;
        await this.userRepository.save(user);
      }
    }

    const updated = await this.roleChangeRepository.save(request);

    // TODO: Enviar notificación al usuario

    return {
      message: `Solicitud ${
        reviewDto.status === RoleChangeStatus.APPROVED
          ? 'aprobada'
          : 'rechazada'
      } exitosamente`,
      data: updated,
    };
  }

  async getUserRequests(userId: string): Promise<RoleChangeRequest[]> {
    return this.roleChangeRepository.find({
      where: { user: { id: userId } },
      relations: ['reviewed_by'],
      order: { created_at: 'DESC' },
    });
  }
}
