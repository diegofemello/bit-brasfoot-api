import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Club } from './entities/club.entity';
import { ClubService } from './club.service';
import { ClubController } from './club.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Club])],
  controllers: [ClubController],
  providers: [ClubService],
  exports: [ClubService],
})
export class ClubModule {}
