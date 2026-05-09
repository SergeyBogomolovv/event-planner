import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Event, EventStatus } from '../events/event.entity';
import {
  EventParticipant,
  EventParticipantStatus,
} from '../participants/event-participant.entity';
import { EmailMessageType } from '../mail/email-message.entity';
import { MailService } from '../mail/mail.service';
import { User, UserRole } from '../users/user.entity';
import { Notification, NotificationType } from './notification.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    @InjectRepository(EventParticipant)
    private readonly participants: Repository<EventParticipant>,
    private readonly mailService: MailService,
  ) {}

  async findMine(user: User): Promise<Notification[]> {
    const notifications = await this.notifications.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return this.hideInaccessibleRelatedEvents(notifications, user);
  }

  async findLatest(user: User, take = 5): Promise<Notification[]> {
    const notifications = await this.notifications.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
      take,
    });
    return this.hideInaccessibleRelatedEvents(notifications, user);
  }

  async findUnreadLatest(user: User, take = 5): Promise<Notification[]> {
    const notifications = await this.notifications.find({
      where: { userId: user.id, readAt: IsNull() },
      order: { createdAt: 'DESC' },
      take,
    });
    return this.hideInaccessibleRelatedEvents(notifications, user);
  }

  countUnread(user: User): Promise<number> {
    return this.notifications.count({
      where: {
        userId: user.id,
        readAt: IsNull(),
      },
    });
  }

  async markRead(notificationId: string, user: User): Promise<Notification> {
    const notification = await this.notifications.findOne({
      where: { id: notificationId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    if (notification.userId !== user.id) {
      throw new ForbiddenException('Notification belongs to another user');
    }
    if (!notification.readAt) {
      notification.readAt = new Date();
      return this.notifications.save(notification);
    }
    return notification;
  }

  async notifyEventInvitation(participant: EventParticipant): Promise<void> {
    const event = participant.event;
    const title = 'Новое приглашение';
    const message = `${participant.invitedBy.name} приглашает вас на мероприятие "${event.title}".`;

    await this.createNotification({
      user: participant.user,
      type: NotificationType.EventInvitation,
      title,
      message,
      event,
    });
    await this.queueEmail({
      user: participant.user,
      type: EmailMessageType.EventInvitation,
      subject: `Приглашение: ${event.title}`,
      body: message,
      relatedEventId: event.id,
    });
  }

  async notifyEventUpdated(event: Event): Promise<void> {
    if (event.status === EventStatus.Draft) {
      return;
    }
    const recipients = await this.findEventRecipients(event.id);
    await this.notifyEventRecipients({
      event,
      recipients,
      notificationType: NotificationType.EventUpdated,
      emailType: EmailMessageType.EventUpdated,
      title: 'Мероприятие обновлено',
      message: `Организатор обновил мероприятие "${event.title}".`,
      subject: `Обновление мероприятия: ${event.title}`,
    });
  }

  async notifyEventCancelled(event: Event): Promise<void> {
    const recipients = await this.findEventRecipients(event.id);
    await this.notifyEventRecipients({
      event,
      recipients,
      notificationType: NotificationType.EventCancelled,
      emailType: EmailMessageType.EventCancelled,
      title: 'Мероприятие отменено',
      message: `Мероприятие "${event.title}" отменено организатором.`,
      subject: `Мероприятие отменено: ${event.title}`,
    });
  }

  async notifyParticipantAccepted(
    participant: EventParticipant,
  ): Promise<void> {
    await this.createNotification({
      user: participant.event.organizer,
      type: NotificationType.ParticipantAccepted,
      title: 'Приглашение принято',
      message: `${participant.user.name} принял приглашение на "${participant.event.title}".`,
      event: participant.event,
    });
  }

  async notifyParticipantDeclined(
    participant: EventParticipant,
  ): Promise<void> {
    await this.createNotification({
      user: participant.event.organizer,
      type: NotificationType.ParticipantDeclined,
      title: 'Приглашение отклонено',
      message: `${participant.user.name} отклонил приглашение на "${participant.event.title}".`,
      event: participant.event,
    });
  }

  private async notifyEventRecipients(params: {
    event: Event;
    recipients: User[];
    notificationType: NotificationType;
    emailType: EmailMessageType;
    title: string;
    message: string;
    subject: string;
  }): Promise<void> {
    for (const recipient of params.recipients) {
      await this.createNotification({
        user: recipient,
        type: params.notificationType,
        title: params.title,
        message: params.message,
        event: params.event,
      });
      await this.queueEmail({
        user: recipient,
        type: params.emailType,
        subject: params.subject,
        body: params.message,
        relatedEventId: params.event.id,
      });
    }
  }

  private async findEventRecipients(eventId: string): Promise<User[]> {
    const participants = await this.participants.find({
      where: {
        eventId,
        status: In([
          EventParticipantStatus.Invited,
          EventParticipantStatus.Accepted,
        ]),
      },
    });
    return this.uniqueUsers(
      participants.map((participant) => participant.user),
    );
  }

  private uniqueUsers(users: User[]): User[] {
    return [...new Map(users.map((user) => [user.id, user])).values()];
  }

  private async hideInaccessibleRelatedEvents(
    notifications: Notification[],
    user: User,
  ): Promise<Notification[]> {
    if (user.role === UserRole.Admin) {
      return notifications;
    }

    const relatedEvents = notifications
      .map((notification) => notification.relatedEvent)
      .filter((event): event is Event => Boolean(event));
    const eventIds = [...new Set(relatedEvents.map((event) => event.id))];
    if (!eventIds.length) {
      return notifications;
    }

    const viewableEventIds = new Set(
      relatedEvents
        .filter((event) => event.organizerId === user.id)
        .map((event) => event.id),
    );

    const participants = await this.participants.find({
      where: {
        eventId: In(eventIds),
        userId: user.id,
        status: In([
          EventParticipantStatus.Invited,
          EventParticipantStatus.Accepted,
        ]),
      },
    });
    for (const participant of participants) {
      viewableEventIds.add(participant.eventId);
    }

    return notifications.map((notification) => {
      if (
        notification.relatedEvent &&
        !viewableEventIds.has(notification.relatedEvent.id)
      ) {
        notification.relatedEvent = null;
      }
      return notification;
    });
  }

  private createNotification(params: {
    user: User;
    type: NotificationType;
    title: string;
    message: string;
    event: Event;
  }): Promise<Notification> {
    return this.notifications.save(
      this.notifications.create({
        userId: params.user.id,
        user: params.user,
        type: params.type,
        title: params.title,
        message: params.message,
        relatedEventId: params.event.id,
        relatedEvent: params.event,
        readAt: null,
      }),
    );
  }

  private async queueEmail(params: {
    user: User;
    type: EmailMessageType;
    subject: string;
    body: string;
    relatedEventId: string;
  }): Promise<void> {
    try {
      await this.mailService.queueEmail(params);
    } catch (error) {
      this.logger.warn(
        `Email queue failed for user=${params.user.id} event=${params.relatedEventId}: ${this.resolveErrorMessage(error)}`,
      );
      return;
    }
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown email queue error';
  }
}
