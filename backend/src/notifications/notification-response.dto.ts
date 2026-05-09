import { EventResponseDto } from '../events/event-response.dto';
import { User } from '../users/user.entity';
import { Notification, NotificationType } from './notification.entity';

export class NotificationResponseDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEventId: string | null;
  relatedEvent: EventResponseDto | null;
  readAt: Date | null;
  createdAt: Date;

  constructor(notification: Notification, currentUser: User) {
    this.id = notification.id;
    this.type = notification.type;
    this.title = notification.title;
    this.message = notification.message;
    this.relatedEventId = notification.relatedEvent
      ? notification.relatedEventId
      : null;
    this.relatedEvent = notification.relatedEvent
      ? new EventResponseDto(notification.relatedEvent, currentUser)
      : null;
    this.readAt = notification.readAt;
    this.createdAt = notification.createdAt;
  }
}
