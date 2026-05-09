import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../events/event.entity';
import { EventParticipant } from '../participants/event-participant.entity';
import { User } from '../users/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Event, EventParticipant])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
