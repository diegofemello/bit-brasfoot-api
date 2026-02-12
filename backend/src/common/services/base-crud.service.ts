import {
    DeepPartial,
    FindManyOptions,
    FindOptionsWhere,
    Repository,
} from 'typeorm';
import { PaginationDto } from '../dto/pagination.dto';
import { PaginatedResult } from '../interfaces/paginated-result.interface';

export abstract class BaseCrudService<T extends { id: string }> {
  protected constructor(protected readonly repository: Repository<T>) {}

  async create(payload: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(payload);
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findOneBy({ id } as FindOptionsWhere<T>);
  }

  async findPaginated(
    pagination: PaginationDto,
    options: Omit<FindManyOptions<T>, 'skip' | 'take'> = {},
  ): Promise<PaginatedResult<T>> {
    const page = pagination.page;
    const limit = pagination.limit;

    const [data, total] = await this.repository.findAndCount({
      ...options,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
