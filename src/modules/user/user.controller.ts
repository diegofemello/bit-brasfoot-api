import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() payload: CreateUserDto) {
    return this.userService.createManager(payload);
  }

  @Get()
  list(@Query() pagination: PaginationDto) {
    return this.userService.list(pagination);
  }
}
