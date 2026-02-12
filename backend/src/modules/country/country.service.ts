import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
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

  async findCountryById(id: string) {
    const country = await this.findById(id);

    if (!country) {
      throw new NotFoundException('País não encontrado');
    }

    return country;
  }

  async updateCountry(id: string, payload: UpdateCountryDto) {
    await this.findCountryById(id);

    const updated = await this.repository.save({
      id,
      ...payload,
    });

    return updated;
  }

  async removeCountry(id: string) {
    await this.findCountryById(id);
    await this.repository.delete(id);

    return {
      success: true,
      message: 'País removido com sucesso',
    };
  }
}
