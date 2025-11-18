import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async create(createUserDto: CreateUserDto): Promise<User> {
    const emailExists = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (emailExists) {
      throw new ConflictException('El email ya está registrado');
    }

    const dniExists = await this.userRepository.findOne({
      where: { dni: createUserDto.dni },
    });

    if (dniExists) {
      throw new ConflictException('El DNI ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  async findAll(filters: FilterUsersDto): Promise<IPaginatedResponse<User>> {
    const { role, search, sort = 'desc', limit = 10, page = 0 } = filters;

    const query = this.userRepository.createQueryBuilder('user');

    if (role) {
      query.andWhere('user.role = :role', { role });
    }

    if (search) {
      const like = `%${search}%`;
      query.andWhere(
        '(user.first_name LIKE :search OR user.last_name LIKE :search OR user.email LIKE :search)',
        { search: like },
      );
    }

    const [data, total] = await query
      .orderBy('user.created_at', sort.toUpperCase() as 'ASC' | 'DESC')
      .skip(page * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      limit,
      page,
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);

    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRepository.softDelete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
  }

  async updateDonationCount(id: string): Promise<void> {
    const result = await this.userRepository.increment(
      { id },
      'donation_count',
      1,
    );

    if (!result.affected) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
  }
}
