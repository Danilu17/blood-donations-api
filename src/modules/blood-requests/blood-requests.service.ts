import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BloodRequest,
  BloodRequestStatus,
} from './entities/blood-request.entity';
import { CreateBloodRequestDto } from './dto/create-blood-request.dto';
import { UpdateBloodRequestDto } from './dto/update-blood-request.dto';
import { FilterBloodRequestDto } from './dto/filter-blood-request.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class BloodRequestService {
  constructor(
    @InjectRepository(BloodRequest)
    private requestRepo: Repository<BloodRequest>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(userId: string, dto: CreateBloodRequestDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const request = this.requestRepo.create({
      ...dto,
      requested_by: user,
    });

    const saved = await this.requestRepo.save(request);

    return {
      message: 'Solicitud de sangre creada exitosamente',
      data: saved,
    };
  }

  async findAll(filters: FilterBloodRequestDto) {
    const { status, limit = 10, page = 0 } = filters;

    const query = this.requestRepo
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.requested_by', 'requested_by');

    if (status) {
      query.andWhere('request.status = :status', { status });
    }

    const [data, total] = await query
      .orderBy('request.created_at', 'DESC')
      .take(limit)
      .skip(page * limit)
      .getManyAndCount();

    return { data, total, limit, page };
  }

  async update(id: string, adminId: string, dto: UpdateBloodRequestDto) {
    const admin = await this.userRepo.findOne({ where: { id: adminId } });
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Solo administradores pueden modificar solicitudes',
      );
    }

    const req = await this.requestRepo.findOne({ where: { id } });
    if (!req) throw new NotFoundException('Solicitud no encontrada');

    Object.assign(req, dto);
    return await this.requestRepo.save(req);
  }
}
