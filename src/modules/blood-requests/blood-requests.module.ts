import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BloodRequest } from './entities/blood-request.entity';
import { BloodRequestController } from './blood-requests.controller';
import { BloodRequestService } from './blood-requests.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BloodRequest, User])],
  controllers: [BloodRequestController],
  providers: [BloodRequestService],
})
export class BloodRequestModule {}
