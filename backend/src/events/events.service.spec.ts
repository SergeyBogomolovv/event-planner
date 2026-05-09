import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { Repository } from 'typeorm';
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

describe('EventsService', () => {
  function createService(initialEvents: Event[] = []) {
    const store = [...initialEvents];
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
          deletedAt: event.deletedAt ?? null,
        };
        const index = store.findIndex((item) => item.id === saved.id);
        if (index >= 0) {
          store[index] = saved;
        } else {
          store.push(saved);
        }
        return Promise.resolve(saved);
      }),
      find: jest.fn(() =>
        Promise.resolve(
          store
            .filter(
              (event) =>
                event.organizerId === organizerUser.id &&
                event.deletedAt === null,
            )
            .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
        ),
      ),
      findOne: jest.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve(
          store.find(
            (event) => event.id === where.id && event.deletedAt === null,
          ) ?? null,
        ),
      ),
      softRemove: jest.fn((event: Event): Promise<Event> => {
        event.deletedAt = now;
        return Promise.resolve(event);
      }),
    };
    return {
      service: new EventsService(repo as unknown as Repository<Event>),
      repo,
      store,
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

  it('prevents non-organizer from editing', async () => {
    const { service } = createService([createEvent()]);

    await expect(
      service.update('event-1', { title: 'New title' }, otherUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows organizer to clear optional event fields', async () => {
    const { service, store } = createService([createEvent()]);

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

  it('hides soft-deleted events from main lists', async () => {
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
    deletedAt: null,
    ...overrides,
  };
}
