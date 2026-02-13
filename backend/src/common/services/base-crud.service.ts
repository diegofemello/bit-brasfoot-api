import { DeepPartial, Repository } from 'typeorm';
import { BaseRepository } from './base.repository';

export abstract class BaseCrudService<
  T extends { id: string },
> extends BaseRepository<T> {
  protected constructor(protected readonly repository: Repository<T>) {
    super(repository);
  }

  async create(payload: DeepPartial<T>): Promise<T> {
    return this.saveEntity(this.createEntity(payload));
  }
}
