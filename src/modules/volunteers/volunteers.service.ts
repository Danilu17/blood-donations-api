import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateVolunteerDto } from './dto/create-volunteer.dto';
import { FilterVolunteersDto } from './dto/filter-volunteers.dto';
import { IPaginatedResponse } from '../../common/interfaces/paginated-response.interface';

@Injectable()
export class VolunteersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // CREAR VOLUNTARIO
  async create(dto: CreateVolunteerDto) {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (user.role === UserRole.ORGANIZER) {
      throw new ConflictException('Este usuario ya es voluntario');
    }

    user.role = UserRole.ORGANIZER;
    const saved = await this.userRepository.save(user);

    return {
      message: 'Voluntario creado exitosamente',
      data: saved,
    };
  }

  // LISTAR VOLUNTARIOS
  async findAll(
    filters: FilterVolunteersDto,
  ): Promise<IPaginatedResponse<User>> {
    const { search, sort = 'asc', limit = 10, page = 0 } = filters;

    const query = this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.ORGANIZER });

    if (search) {
      query.andWhere(
        '(user.first_name ILIKE :s OR user.last_name ILIKE :s OR user.email ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    const [data, total] = await query
      .orderBy('user.first_name', sort.toUpperCase() as 'ASC' | 'DESC')
      .skip(page * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, limit, page };
  }

  // OBTENER UN VOLUNTARIO
  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user || user.role !== UserRole.ORGANIZER)
      throw new NotFoundException('Voluntario no encontrado');

    return user;
  }

  // REMOVER VOLUNTARIO
  async remove(id: string) {
    const user = await this.findOne(id);

    user.role = UserRole.DONOR; // vuelve a donante
    await this.userRepository.save(user);

    return {
      message: 'Voluntario removido correctamente',
      data: user,
    };
  }
}
