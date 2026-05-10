import type { Repository } from 'typeorm';
import { Event, EventFormat, EventStatus } from '../events/event.entity';
import type { NotificationsService } from '../notifications/notifications.service';
import { Notification } from '../notifications/notification.entity';
import {
  EventParticipant,
  EventParticipantStatus,
} from '../participants/event-participant.entity';
import { User, UserRole, UserStatus } from '../users/user.entity';
import { DashboardService } from './dashboard.service';

const now = new Date('2026-01-01T00:00:00Z');

type EventsQueryBuilderMock = {
  leftJoinAndSelect: jest.MockedFunction<() => EventsQueryBuilderMock>;
  leftJoin: jest.MockedFunction<() => EventsQueryBuilderMock>;
  where: jest.MockedFunction<() => EventsQueryBuilderMock>;
  andWhere: jest.MockedFunction<() => EventsQueryBuilderMock>;
  orderBy: jest.MockedFunction<() => EventsQueryBuilderMock>;
  addOrderBy: jest.MockedFunction<() => EventsQueryBuilderMock>;
  take: jest.MockedFunction<() => EventsQueryBuilderMock>;
  getMany: jest.MockedFunction<() => Promise<Event[]>>;
};

type ParticipantsQueryBuilderMock = {
  innerJoin: jest.MockedFunction<() => ParticipantsQueryBuilderMock>;
  innerJoinAndSelect: jest.MockedFunction<() => ParticipantsQueryBuilderMock>;
  where: jest.MockedFunction<() => ParticipantsQueryBuilderMock>;
  andWhere: jest.MockedFunction<() => ParticipantsQueryBuilderMock>;
  orderBy: jest.MockedFunction<() => ParticipantsQueryBuilderMock>;
  take: jest.MockedFunction<() => ParticipantsQueryBuilderMock>;
  getCount: jest.MockedFunction<() => Promise<number>>;
  getMany: jest.MockedFunction<() => Promise<EventParticipant[]>>;
};

describe('DashboardService', () => {
  function createService() {
    const createdEvent = createEvent({ id: 'created' });
    const participatingEvent = createEvent({ id: 'participating' });
    const invitation = createParticipant({ event: participatingEvent });
    const unreadNotification = createNotification();

    const eventsQuery: EventsQueryBuilderMock = {
      leftJoinAndSelect: jest.fn(() => eventsQuery),
      leftJoin: jest.fn(() => eventsQuery),
      where: jest.fn(() => eventsQuery),
      andWhere: jest.fn(() => eventsQuery),
      orderBy: jest.fn(() => eventsQuery),
      addOrderBy: jest.fn(() => eventsQuery),
      take: jest.fn(() => eventsQuery),
      getMany: jest.fn(() => Promise.resolve([participatingEvent])),
    };
    const participantsQuery: ParticipantsQueryBuilderMock = {
      innerJoin: jest.fn(() => participantsQuery),
      innerJoinAndSelect: jest.fn(() => participantsQuery),
      where: jest.fn(() => participantsQuery),
      andWhere: jest.fn(() => participantsQuery),
      orderBy: jest.fn(() => participantsQuery),
      take: jest.fn(() => participantsQuery),
      getCount: jest.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(1),
      getMany: jest.fn(() => Promise.resolve([invitation])),
    };

    const eventsRepo = {
      count: jest.fn(() => Promise.resolve(2)),
      find: jest.fn(() => Promise.resolve([createdEvent])),
      createQueryBuilder: jest.fn(() => eventsQuery),
    };
    const participantsRepo = {
      createQueryBuilder: jest.fn(() => participantsQuery),
    };
    const notificationsService = {
      countUnread: jest.fn(() => Promise.resolve(4)),
      findUnreadLatest: jest.fn(() => Promise.resolve([unreadNotification])),
    };

    return {
      service: new DashboardService(
        eventsRepo as unknown as Repository<Event>,
        participantsRepo as unknown as Repository<EventParticipant>,
        notificationsService as unknown as NotificationsService,
      ),
      eventsRepo,
      participantsQuery,
      notificationsService,
    };
  }

  it('builds dashboard data for current user', async () => {
    const user = createUser();
    const { service, eventsRepo, participantsQuery, notificationsService } =
      createService();

    const dashboard = await service.findMine(user);

    expect(dashboard.counts).toEqual({
      createdEvents: 2,
      participatingEvents: 5,
      pendingInvitations: 1,
      unreadNotifications: 4,
    });
    expect(eventsRepo.count).toHaveBeenCalledWith({
      where: { organizerId: user.id },
    });
    expect(participantsQuery.innerJoin).toHaveBeenCalledWith(
      'participant.event',
      'event',
    );
    expect(participantsQuery.andWhere).toHaveBeenCalledWith(
      'event.status = :eventStatus',
      { eventStatus: EventStatus.Active },
    );
    expect(notificationsService.findUnreadLatest).toHaveBeenCalledWith(user, 3);
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
  const organizer = createUser({ id: 'organizer-1' });
  return {
    id: 'event-1',
    organizerId: organizer.id,
    organizer,
    title: 'Мероприятие',
    description: 'Описание',
    startsAt: now,
    endsAt: null,
    location: null,
    format: EventFormat.Offline,
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
  const user = createUser();
  const invitedBy = createUser({ id: 'organizer-1' });
  const event = createEvent({
    organizer: invitedBy,
    organizerId: invitedBy.id,
  });
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
  return {
    id: 'notification-1',
    userId: user.id,
    user,
    type: 'event_invitation',
    title: 'Уведомление',
    message: 'Текст',
    relatedEventId: null,
    relatedEvent: null,
    readAt: null,
    createdAt: now,
    ...overrides,
  } as Notification;
}
