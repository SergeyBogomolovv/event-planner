import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../events/event.entity';
import { EventParticipant } from '../participants/event-participant.entity';
import { MailModule } from '../mail/mail.module';
import { CsrfGuard } from '../auth/csrf.guard';
import { Notification } from './notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Event, EventParticipant]),
    MailModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, CsrfGuard],
  exports: [NotificationsService],
})
export class NotificationsModule {}
