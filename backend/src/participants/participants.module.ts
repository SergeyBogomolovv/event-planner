import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../events/event.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { CsrfGuard } from '../auth/csrf.guard';
import { User } from '../users/user.entity';
import { EventParticipant } from './event-participant.entity';
import { ParticipantsController } from './participants.controller';
import { ParticipantsService } from './participants.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventParticipant, Event, User]),
    NotificationsModule,
  ],
  controllers: [ParticipantsController],
  providers: [ParticipantsService, CsrfGuard],
  exports: [ParticipantsService],
})
export class ParticipantsModule {}
