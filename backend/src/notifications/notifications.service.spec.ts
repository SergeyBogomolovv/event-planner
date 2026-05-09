import { ForbiddenException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { Event, EventFormat, EventStatus } from '../events/event.entity';
import { EmailMessageType } from '../mail/email-message.entity';
import type { MailService } from '../mail/mail.service';
import {
  EventParticipant,
  EventParticipantStatus,
} from '../participants/event-participant.entity';
import { User, UserRole, UserStatus } from '../users/user.entity';
import { Notification, NotificationType } from './notification.entity';
import { NotificationsService } from './notifications.service';

const now = new Date('2026-01-01T00:00:00Z');

describe('NotificationsService', () => {
  function createService(initialNotifications: Notification[] = []) {
    const notificationsStore = [...initialNotifications];
    const participantsStore: EventParticipant[] = [];

    const notificationsRepo = {
      create: jest.fn((data: Partial<Notification>) => data as Notification),
      save: jest.fn((notification: Notification) => {
        const saved = {
          ...notification,
          id:
            notification.id ?? `notification-${notificationsStore.length + 1}`,
          createdAt: notification.createdAt ?? now,
        };
        const index = notificationsStore.findIndex(
          (item) => item.id === saved.id,
        );
        if (index >= 0) {
          notificationsStore[index] = saved;
        } else {
          notificationsStore.push(saved);
        }
        return Promise.resolve(saved);
      }),
      find: jest.fn(({ where }: { where: Partial<Notification> }) =>
        Promise.resolve(
          notificationsStore.filter((notification) =>
            Object.entries(where).every(
              ([key, value]) =>
                notification[key as keyof Notification] === value,
            ),
          ),
        ),
      ),
      findOne: jest.fn(({ where }: { where: Partial<Notification> }) =>
        Promise.resolve(
          notificationsStore.find((notification) =>
            Object.entries(where).every(
              ([key, value]) =>
                notification[key as keyof Notification] === value,
            ),
          ) ?? null,
        ),
      ),
      count: jest.fn(({ where }: { where: Partial<Notification> }) =>
        Promise.resolve(
          notificationsStore.filter((notification) =>
            Object.entries(where).every(([key, value]) => {
              if (key === 'readAt') {
                return notification.readAt === null;
              }
              return notification[key as keyof Notification] === value;
            }),
          ).length,
        ),
      ),
    };

    const participantsRepo = {
      find: jest.fn(({ where }: { where?: Partial<EventParticipant> } = {}) => {
        if (!where) {
          return Promise.resolve(participantsStore);
        }
        return Promise.resolve(
          participantsStore.filter((participant) => {
            if (
              where.userId !== undefined &&
              participant.userId !== where.userId
            ) {
              return false;
            }
            return [
              EventParticipantStatus.Invited,
              EventParticipantStatus.Accepted,
            ].includes(participant.status);
          }),
        );
      }),
    };

    const mailService = {
      queueEmail: jest.fn(() => Promise.resolve()),
    };

    return {
      service: new NotificationsService(
        notificationsRepo as unknown as Repository<Notification>,
        participantsRepo as unknown as Repository<EventParticipant>,
        mailService as unknown as MailService,
      ),
      notificationsStore,
      participantsStore,
      mailService,
    };
  }

  it('marks own notification as read', async () => {
    const user = createUser();
    const notification = createNotification({ user, userId: user.id });
    const { service } = createService([notification]);

    const result = await service.markRead(notification.id, user);

    expect(result.readAt).toBeInstanceOf(Date);
  });

  it('rejects read access to another user notification', async () => {
    const owner = createUser({ id: 'owner' });
    const currentUser = createUser({ id: 'current' });
    const { service } = createService([
      createNotification({ user: owner, userId: owner.id }),
    ]);

    await expect(
      service.markRead('notification-1', currentUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('counts only unread current user notifications', async () => {
    const user = createUser({ id: 'current' });
    const { service } = createService([
      createNotification({ id: 'unread', user, userId: user.id }),
      createNotification({
        id: 'read',
        user,
        userId: user.id,
        readAt: now,
      }),
      createNotification({
        id: 'other',
        user: createUser({ id: 'other' }),
        userId: 'other',
      }),
    ]);

    await expect(service.countUnread(user)).resolves.toBe(1);
  });

  it('hides related event when user lost event access', async () => {
    const user = createUser({ id: 'removed-user' });
    const event = createEvent();
    const notification = createNotification({
      user,
      userId: user.id,
      relatedEventId: event.id,
      relatedEvent: event,
    });
    const { service } = createService([notification]);

    const notifications = await service.findMine(user);

    expect(notifications[0].relatedEvent).toBeNull();
  });

  it('keeps related event when user still has invitation access', async () => {
    const user = createUser({ id: 'invited-user' });
    const event = createEvent();
    const notification = createNotification({
      user,
      userId: user.id,
      relatedEventId: event.id,
      relatedEvent: event,
    });
    const { service, participantsStore } = createService([notification]);
    participantsStore.push(
      createParticipant({
        event,
        eventId: event.id,
        user,
        userId: user.id,
        status: EventParticipantStatus.Invited,
      }),
    );

    const notifications = await service.findMine(user);

    expect(notifications[0].relatedEvent?.id).toBe(event.id);
  });

  it('creates notification and email message for invitation', async () => {
    const event = createEvent();
    const user = createUser({ id: 'invited' });
    const invitedBy = createUser({ id: 'organizer', name: 'Организатор' });
    const participant = createParticipant({ event, user, invitedBy });
    const { service, notificationsStore, mailService } = createService();

    await service.notifyEventInvitation(participant);

    expect(notificationsStore).toHaveLength(1);
    expect(notificationsStore[0]).toMatchObject({
      userId: user.id,
      type: NotificationType.EventInvitation,
      relatedEventId: event.id,
    });
    expect(mailService.queueEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        user,
        type: EmailMessageType.EventInvitation,
        relatedEventId: event.id,
      }),
    );
  });

  it('does not fail invitation notification when email queue fails', async () => {
    const event = createEvent();
    const user = createUser({ id: 'invited' });
    const invitedBy = createUser({ id: 'organizer', name: 'Организатор' });
    const participant = createParticipant({ event, user, invitedBy });
    const { service, notificationsStore, mailService } = createService();
    mailService.queueEmail.mockRejectedValueOnce(new Error('Redis is down'));

    await expect(
      service.notifyEventInvitation(participant),
    ).resolves.toBeUndefined();
    expect(notificationsStore).toHaveLength(1);
  });
});

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: 'hash',
    name: 'Пользователь',
    role: UserRole.User,
    status: UserStatus.Active,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createEvent(overrides: Partial<Event> = {}): Event {
  const organizer = createUser({ id: 'organizer', name: 'Организатор' });
  return {
    id: 'event-1',
    organizerId: organizer.id,
    organizer,
    title: 'Встреча',
    description: 'Описание',
    startsAt: new Date('2026-06-01T10:00:00.000Z'),
    endsAt: null,
    location: null,
    format: EventFormat.Online,
    participantLimit: null,
    status: EventStatus.Active,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createParticipant(
  overrides: Partial<EventParticipant> = {},
): EventParticipant {
  const event = createEvent();
  const user = createUser({ id: 'invited' });
  const invitedBy = event.organizer;
  return {
    id: 'participant-1',
    eventId: event.id,
    event,
    userId: user.id,
    user,
    status: EventParticipantStatus.Invited,
    invitedById: invitedBy.id,
    invitedBy,
    invitedAt: now,
    respondedAt: null,
    removedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createNotification(
  overrides: Partial<Notification> = {},
): Notification {
  const user = createUser();
  const event = createEvent();
  return {
    id: 'notification-1',
    userId: user.id,
    user,
    type: NotificationType.EventInvitation,
    title: 'Заголовок',
    message: 'Текст',
    relatedEventId: event.id,
    relatedEvent: event,
    readAt: null,
    createdAt: now,
    ...overrides,
  };
}
