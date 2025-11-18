// src/modules/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { IPaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ============================================================
  // CREATE USER
  // ============================================================
  async create(createUserDto: CreateUserDto): Promise<User> {
    const emailExists = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (emailExists) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return await this.userRepository.save(user);
  }

  // ============================================================
  // GET USERS WITH FILTERS
  // ============================================================
  async findAll(filters: FilterUsersDto): Promise<IPaginatedResponse<User>> {
    const { role, search, sort = 'desc', limit = 10, page = 0 } = filters;

    const query = this.userRepository.createQueryBuilder('user');

    if (role) {
      query.andWhere('user.role = :role', { role });
    }

    query.andWhere(
      `(user.first_name LIKE :search OR user.last_name LIKE :search OR user.email LIKE :search)`,
      { search: `%${search}%` },
    );

    const [data, total] = await query
      .orderBy('user.created_at', sort.toUpperCase() as 'ASC' | 'DESC')
      .take(limit)
      .skip(page * limit)
      .getManyAndCount();

    return {
      data,
      total,
      limit,
      page,
    };
  }

  // ============================================================
  // FIND ONE USER
  // ============================================================
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  // ============================================================
  // UPDATE USER
  // ============================================================
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);

    return await this.userRepository.save(user);
  }

  // ============================================================
  // DELETE USER (SOFT DELETE)
  // ============================================================
  async remove(id: string): Promise<void> {
    const result = await this.userRepository.softDelete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
  }

  // ============================================================
  // INCREASE DONATION COUNT
  // ============================================================
  async updateDonationCount(id: string): Promise<void> {
    const result = await this.userRepository.increment(
      { id },
      'donationCount',
      1,
    );

    if (!result.affected) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
  }
}
