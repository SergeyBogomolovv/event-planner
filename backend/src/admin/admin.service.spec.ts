import { BadRequestException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { Event, EventFormat, EventStatus } from '../events/event.entity';
import {
  EventParticipant,
  EventParticipantStatus,
} from '../participants/event-participant.entity';
import { User, UserRole, UserStatus } from '../users/user.entity';
import { AdminService } from './admin.service';

const now = new Date('2026-01-01T00:00:00Z');

type CountQueryMock<T extends string> = {
  select: jest.MockedFunction<() => CountQueryMock<T>>;
  addSelect: jest.MockedFunction<() => CountQueryMock<T>>;
  groupBy: jest.MockedFunction<() => CountQueryMock<T>>;
  where: jest.MockedFunction<() => CountQueryMock<T>>;
  andWhere: jest.MockedFunction<() => CountQueryMock<T>>;
  getRawMany: jest.MockedFunction<
    () => Promise<Array<{ key?: T; eventId?: string; count: string }>>
  >;
};

describe('AdminService', () => {
  function createService() {
    const users = [
      createUser(),
      createUser({ id: 'admin-1', role: UserRole.Admin }),
    ];
    const events = [createEvent()];

    const usersRepo = {
      count: jest.fn(() => Promise.resolve(users.length)),
      find: jest.fn(() => Promise.resolve(users)),
      findAndCount: jest.fn(() => Promise.resolve([users, users.length])),
      findOne: jest.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve(users.find((user) => user.id === where.id) ?? null),
      ),
      save: jest.fn((user: User) => Promise.resolve(user)),
      createQueryBuilder: jest.fn(() =>
        createCountQuery<UserRole | UserStatus>([
          { key: UserRole.User, count: '1' },
          { key: UserRole.Admin, count: '1' },
        ]),
      ),
    };
    const eventsRepo = {
      count: jest.fn(() => Promise.resolve(events.length)),
      find: jest.fn(() => Promise.resolve(events)),
      findAndCount: jest.fn(() => Promise.resolve([events, events.length])),
      createQueryBuilder: jest.fn(() =>
        createCountQuery<EventStatus>([
          { key: EventStatus.Active, count: '1' },
        ]),
      ),
    };
    const participantsRepo = {
      count: jest.fn(() => Promise.resolve(2)),
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(
          createCountQuery<EventParticipantStatus>([
            { key: EventParticipantStatus.Accepted, count: '2' },
          ]),
        )
        .mockReturnValue(
          createCountQuery([{ eventId: 'event-1', count: '2' }]),
        ),
    };

    return {
      service: new AdminService(
        usersRepo as unknown as Repository<User>,
        eventsRepo as unknown as Repository<Event>,
        participantsRepo as unknown as Repository<EventParticipant>,
      ),
      users,
      usersRepo,
      eventsRepo,
      participantsRepo,
    };
  }

  it('returns system stats with zeroes for missing statuses', async () => {
    const { service } = createService();

    const stats = await service.getStats();

    expect(stats.users.total).toBe(2);
    expect(stats.users.byRole.admin).toBe(1);
    expect(stats.users.byStatus.blocked).toBe(0);
    expect(stats.events.byStatus.active).toBe(1);
    expect(stats.events.byStatus.draft).toBe(0);
    expect(stats.participants.byStatus.accepted).toBe(2);
  });

  it('blocks and unblocks users', async () => {
    const { service, usersRepo } = createService();
    const admin = createUser({ id: 'admin-1', role: UserRole.Admin });

    const blocked = await service.blockUser('user-1', admin);
    expect(blocked.status).toBe(UserStatus.Blocked);

    const unblocked = await service.unblockUser('user-1');
    expect(unblocked.status).toBe(UserStatus.Active);
    expect(usersRepo.save).toHaveBeenCalledTimes(2);
  });

  it('returns paginated users', async () => {
    const { service, usersRepo } = createService();

    const page = await service.findUsers({ page: 2, limit: 20 });

    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(2);
    expect(usersRepo.findAndCount).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
      skip: 20,
      take: 20,
    });
  });

  it('prevents admin from blocking own account', async () => {
    const { service } = createService();
    const admin = createUser({ id: 'admin-1', role: UserRole.Admin });

    await expect(service.blockUser(admin.id, admin)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns events with accepted participant counts', async () => {
    const { service, eventsRepo, participantsRepo } = createService();
    participantsRepo.createQueryBuilder.mockReset();
    participantsRepo.createQueryBuilder.mockReturnValue(
      createCountQuery([{ eventId: 'event-1', count: '2' }]),
    );

    const events = await service.findEvents({ page: 1, limit: 20 });

    expect(events.items).toHaveLength(1);
    expect(events.items[0].participantCount).toBe(2);
    expect(eventsRepo.findAndCount).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
      skip: 0,
      take: 20,
    });
  });
});

function createCountQuery<T extends string>(
  rows: Array<{ key?: T; eventId?: string; count: string }>,
): CountQueryMock<T> {
  const query: CountQueryMock<T> = {
    select: jest.fn(() => query),
    addSelect: jest.fn(() => query),
    groupBy: jest.fn(() => query),
    where: jest.fn(() => query),
    andWhere: jest.fn(() => query),
    getRawMany: jest.fn(() => Promise.resolve(rows)),
  };
  return query;
}

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: 'hash',
    name: 'User',
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
    title: 'Event',
    description: 'Description',
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
