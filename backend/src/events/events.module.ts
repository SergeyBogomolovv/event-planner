import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventParticipant } from '../participants/event-participant.entity';
import { Event } from './event.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, EventParticipant]),
    NotificationsModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
