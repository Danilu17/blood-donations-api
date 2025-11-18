import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Center } from './entities/center.entity';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';
import { FilterCentersDto } from './dto/filter-centers.dto';
import { IPaginatedResponse } from '../../common/interfaces/paginated-response.interface';

@Injectable()
export class CentersService {
  constructor(
    @InjectRepository(Center)
    private repository: Repository<Center>,
  ) {}

  async create(dto: CreateCenterDto) {
    const exists = await this.repository.findOne({
      where: { name: dto.name, address: dto.address },
    });

    if (exists) throw new ConflictException('Este centro ya existe');

    const center = this.repository.create(dto);
    const saved = await this.repository.save(center);

    return {
      message: 'Centro creado exitosamente',
      data: saved,
    };
  }

  async findAll(
    filters: FilterCentersDto,
  ): Promise<IPaginatedResponse<Center>> {
    const {
      city,
      search,
      is_active,
      sort = 'asc',
      page = 0,
      limit = 10,
    } = filters;

    const query = this.repository.createQueryBuilder('center');

    if (city) {
      query.andWhere('center.city ILIKE :city', { city: `%${city}%` });
    }

    if (search) {
      query.andWhere('(center.name ILIKE :s OR center.address ILIKE :s)', {
        s: `%${search}%`,
      });
    }

    if (is_active !== undefined) {
      query.andWhere('center.is_active = :active', { active: is_active });
    }

    const [data, total] = await query
      .orderBy('center.name', sort.toUpperCase() as 'ASC' | 'DESC')
      .skip(page * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, limit, page };
  }

  async findOne(id: string) {
    const center = await this.repository.findOne({ where: { id } });
    if (!center) throw new NotFoundException('Centro no encontrado');
    return center;
  }

  async update(id: string, dto: UpdateCenterDto) {
    const center = await this.findOne(id);
    Object.assign(center, dto);
    return this.repository.save(center);
  }

  async remove(id: string) {
    const center = await this.findOne(id);
    await this.repository.softDelete(id);
  }

  async toggleActive(id: string) {
    const center = await this.findOne(id);
    center.is_active = !center.is_active;
    return this.repository.save(center);
  }
}
