import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CountryService } from './country.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.countryService.findCountryById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() payload: UpdateCountryDto) {
    return this.countryService.updateCountry(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.countryService.removeCountry(id);
  }
}
