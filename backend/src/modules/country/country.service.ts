import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { Country } from './entities/country.entity';

@Injectable()
export class CountryService extends BaseCrudService<Country> {
  constructor(
    @InjectRepository(Country)
    repository: Repository<Country>,
  ) {
    super(repository);
  }

  listAll(pagination: PaginationDto) {
    return this.findPaginated(pagination, {
      order: { name: 'ASC' },
    });
  }

  createCountry(payload: CreateCountryDto) {
    return this.create(payload);
  }
}
