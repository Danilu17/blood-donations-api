import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleChangeService } from './role-change.service';
import { RoleChangeController } from './role-change.controller';
import { RoleChangeRequest } from './entities/role-change-request.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([RoleChangeRequest]), UsersModule],
  controllers: [RoleChangeController],
  providers: [RoleChangeService],
  exports: [RoleChangeService],
})
export class RoleChangeModule {}
