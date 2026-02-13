import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService extends BaseCrudService<User> {
  constructor(
    @InjectRepository(User)
    repository: Repository<User>,
  ) {
    super(repository);
  }

  createManager(payload: CreateUserDto) {
    return this.create({
      managerName: payload.managerName,
      locale: payload.locale ?? 'pt-BR',
    });
  }

  list(pagination: PaginationDto) {
    return this.findPaginated(pagination, {
      order: { createdAt: 'DESC' },
    });
  }
}
