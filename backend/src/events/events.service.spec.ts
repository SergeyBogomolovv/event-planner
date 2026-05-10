import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import {
  EventParticipant,
  EventParticipantStatus,
} from '../participants/event-participant.entity';
import type { NotificationsService } from '../notifications/notifications.service';
import { User, UserRole, UserStatus } from '../users/user.entity';
import { Event, EventFormat, EventStatus } from './event.entity';
import { EventsService } from './events.service';

const now = new Date('2026-01-01T00:00:00Z');

const organizerUser: User = {
  id: 'organizer-1',
  email: 'organizer@example.com',
  passwordHash: 'hash',
  name: 'Organizer',
  role: UserRole.User,
  status: UserStatus.Active,
  createdAt: now,
  updatedAt: now,
};

const otherUser: User = {
  id: 'user-2',
  email: 'user@example.com',
  passwordHash: 'hash',
  name: 'User',
  role: UserRole.User,
  status: UserStatus.Active,
  createdAt: now,
  updatedAt: now,
};

type ParticipantsQueryBuilderMock = {
  innerJoinAndSelect: jest.MockedFunction<() => ParticipantsQueryBuilderMock>;
  where: jest.MockedFunction<() => ParticipantsQueryBuilderMock>;
  andWhere: jest.MockedFunction<() => ParticipantsQueryBuilderMock>;
  orderBy: jest.MockedFunction<() => ParticipantsQueryBuilderMock>;
  addOrderBy: jest.MockedFunction<() => ParticipantsQueryBuilderMock>;
  getMany: jest.MockedFunction<() => Promise<EventParticipant[]>>;
};

describe('EventsService', () => {
  function createService(initialEvents: Event[] = []) {
    const store = [...initialEvents];
    const participantStore: EventParticipant[] = [];
    const repo = {
      create: jest.fn((data: Partial<Event>): Event => data as Event),
      save: jest.fn((event: Event): Promise<Event> => {
        const saved: Event = {
          ...event,
          id: event.id ?? `event-${store.length + 1}`,
          organizer: event.organizer ?? organizerUser,
          status: event.status ?? EventStatus.Draft,
          createdAt: event.createdAt ?? now,
          updatedAt: now,
        };
        const index = store.findIndex((item) => item.id === saved.id);
        if (index >= 0) {
          store[index] = saved;
        } else {
          store.push(saved);
        }
        return Promise.resolve(saved);
      }),
      find: jest.fn(({ where }: { where: Partial<Event> }) =>
        Promise.resolve(
          store
            .filter(
              (event) =>
                event.organizerId === where.organizerId &&
                (where.status === undefined || event.status === where.status),
            )
            .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
        ),
      ),
      findOne: jest.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve(store.find((event) => event.id === where.id) ?? null),
      ),
      delete: jest.fn((eventId: string): Promise<{ affected: number }> => {
        const index = store.findIndex((event) => event.id === eventId);
        if (index >= 0) {
          store.splice(index, 1);
          return Promise.resolve({ affected: 1 });
        }
        return Promise.resolve({ affected: 0 });
      }),
    };
    const participantsRepo = {
      createQueryBuilder: jest.fn(() => {
        const query: ParticipantsQueryBuilderMock = {
          innerJoinAndSelect: jest.fn(() => query),
          where: jest.fn(() => query),
          andWhere: jest.fn(() => query),
          orderBy: jest.fn(() => query),
          addOrderBy: jest.fn(() => query),
          getMany: jest.fn(() =>
            Promise.resolve(
              participantStore.filter(
                (participant) =>
                  participant.userId === organizerUser.id &&
                  participant.status === EventParticipantStatus.Accepted &&
                  participant.event.status === EventStatus.Active,
              ),
            ),
          ),
        };

        return query;
      }),
      findOne: jest.fn(({ where }: { where: Partial<EventParticipant> }) =>
        Promise.resolve(
          participantStore.find((participant) =>
            Object.entries(where).every(
              ([key, value]) =>
                participant[key as keyof EventParticipant] === value,
            ),
          ) ?? null,
        ),
      ),
    };
    const notificationsService = {
      notifyEventUpdated: jest.fn(() => Promise.resolve()),
      notifyEventCancelled: jest.fn(() => Promise.resolve()),
    };

    return {
      service: new EventsService(
        repo as unknown as Repository<Event>,
        participantsRepo as unknown as Repository<EventParticipant>,
        notificationsService as unknown as NotificationsService,
      ),
      repo,
      store,
      participantStore,
      notificationsService,
    };
  }

  it('creates a draft event', async () => {
    const { service } = createService();

    const event = await service.create(
      {
        title: 'Planning Session',
        description: 'Quarter planning',
        startsAt: '2026-06-01T10:00:00.000Z',
        endsAt: '2026-06-01T12:00:00.000Z',
        location: 'Office',
        format: EventFormat.Offline,
        participantLimit: 12,
      },
      organizerUser,
    );

    expect(event.status).toBe(EventStatus.Draft);
    expect(event.organizerId).toBe(organizerUser.id);
  });

  it('returns only current user events from my list', async () => {
    const { service } = createService([
      createEvent({ id: 'mine', organizerId: organizerUser.id }),
      createEvent({ id: 'another', organizerId: 'another-user' }),
    ]);

    const events = await service.findMine(organizerUser);

    expect(events).toHaveLength(1);
    expect(events[0].id).toBe('mine');
  });

  it('includes organized events in participating list', async () => {
    const organized = createEvent({
      id: 'organized',
      status: EventStatus.Active,
    });
    const acceptedEvent = createEvent({
      id: 'accepted',
      organizerId: otherUser.id,
      organizer: otherUser,
      status: EventStatus.Active,
      startsAt: new Date('2026-06-02T10:00:00.000Z'),
    });
    const { service, participantStore } = createService([
      organized,
      acceptedEvent,
    ]);
    participantStore.push(
      createParticipant({
        eventId: acceptedEvent.id,
        event: acceptedEvent,
        userId: organizerUser.id,
        user: organizerUser,
        status: EventParticipantStatus.Accepted,
      }),
    );

    const events = await service.findParticipating(organizerUser);

    expect(events.map((event) => event.id)).toEqual(['organized', 'accepted']);
  });

  it('hides cancelled events from participating list', async () => {
    const cancelledOrganized = createEvent({
      id: 'cancelled-organized',
      status: EventStatus.Cancelled,
    });
    const cancelledAccepted = createEvent({
      id: 'cancelled-accepted',
      organizerId: otherUser.id,
      organizer: otherUser,
      status: EventStatus.Cancelled,
    });
    const { service, participantStore } = createService([
      cancelledOrganized,
      cancelledAccepted,
    ]);
    participantStore.push(
      createParticipant({
        eventId: cancelledAccepted.id,
        event: cancelledAccepted,
        userId: organizerUser.id,
        user: organizerUser,
        status: EventParticipantStatus.Accepted,
      }),
    );

    const events = await service.findParticipating(organizerUser);

    expect(events).toHaveLength(0);
  });

  it('hides draft organized events from participating list', async () => {
    const { service } = createService([
      createEvent({ id: 'draft-organized', status: EventStatus.Draft }),
    ]);

    const events = await service.findParticipating(organizerUser);

    expect(events).toHaveLength(0);
  });

  it('prevents non-organizer from editing', async () => {
    const { service } = createService([createEvent()]);

    await expect(
      service.update('event-1', { title: 'New title' }, otherUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows organizer to clear optional event fields', async () => {
    const { service, store, notificationsService } = createService([
      createEvent({ status: EventStatus.Active }),
    ]);

    const updated = await service.update(
      'event-1',
      {
        endsAt: null,
        location: null,
        participantLimit: null,
      },
      organizerUser,
    );

    expect(updated.endsAt).toBeNull();
    expect(updated.location).toBeNull();
    expect(updated.participantLimit).toBeNull();
    expect(notificationsService.notifyEventUpdated).toHaveBeenCalledWith(
      updated,
    );
    expect(store[0]).toMatchObject({
      endsAt: null,
      location: null,
      participantLimit: null,
    });
  });

  it('rejects invalid date range when clearing is not requested', async () => {
    const { service } = createService([createEvent()]);

    await expect(
      service.update(
        'event-1',
        { startsAt: '2026-06-01T13:00:00.000Z' },
        organizerUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('runs allowed lifecycle transitions', async () => {
    const { service } = createService([createEvent()]);

    const published = await service.publish('event-1', organizerUser);
    expect(published.status).toBe(EventStatus.Active);

    const completed = await service.complete('event-1', organizerUser);
    expect(completed.status).toBe(EventStatus.Completed);

    await expect(
      service.cancel('event-1', organizerUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deletes events from main lists', async () => {
    const { service } = createService([createEvent()]);

    await service.remove('event-1', organizerUser);
    const events = await service.findMine(organizerUser);

    expect(events).toHaveLength(0);
  });
});

function createEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'event-1',
    organizerId: organizerUser.id,
    organizer: organizerUser,
    title: 'Planning Session',
    description: 'Quarter planning',
    startsAt: new Date('2026-06-01T10:00:00.000Z'),
    endsAt: new Date('2026-06-01T12:00:00.000Z'),
    location: 'Office',
    format: EventFormat.Offline,
    participantLimit: 12,
    status: EventStatus.Draft,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createParticipant(
  overrides: Partial<EventParticipant> = {},
): EventParticipant {
  return {
    id: 'participant-1',
    eventId: 'event-1',
    event: createEvent(),
    userId: otherUser.id,
    user: otherUser,
    status: EventParticipantStatus.Invited,
    invitedById: organizerUser.id,
    invitedBy: organizerUser,
    invitedAt: now,
    respondedAt: null,
    removedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
