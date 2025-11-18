import { Module } from '@nestjs/common';
import { BloodRequestsService } from './blood-requests.service';
import { BloodRequestsController } from './blood-requests.controller';

@Module({
  controllers: [BloodRequestsController],
  providers: [BloodRequestsService],
})
export class BloodRequestsModule {}
