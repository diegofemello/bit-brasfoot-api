import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateCountryDto } from './dto/create-country.dto';
import { CountryService } from './country.service';

@ApiTags('countries')
@Controller('countries')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Get()
  listAll(@Query() pagination: PaginationDto) {
    return this.countryService.listAll(pagination);
  }

  @Post()
  create(@Body() payload: CreateCountryDto) {
    return this.countryService.createCountry(payload);
  }
}
