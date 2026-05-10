import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole, UserStatus } from './user.entity';

const testDate = new Date('2026-01-01T00:00:00Z');

type UserQueryBuilderMock = {
  addSelect: jest.Mock<UserQueryBuilderMock, [string]>;
  where: jest.Mock<UserQueryBuilderMock, [string, Record<string, string>]>;
  andWhere: jest.Mock<
    UserQueryBuilderMock,
    [unknown, Record<string, unknown>?]
  >;
  leftJoin: jest.Mock<
    UserQueryBuilderMock,
    [unknown, string, string, Record<string, unknown>]
  >;
  orderBy: jest.Mock<UserQueryBuilderMock, [string, string]>;
  limit: jest.Mock<UserQueryBuilderMock, [number]>;
  getOne: jest.Mock<Promise<User | null>, []>;
  getMany: jest.Mock<Promise<User[]>, []>;
};

describe('UsersService', () => {
  function createService(existingUsers: User[] = []) {
    const store = [...existingUsers];
    let lastQuery: UserQueryBuilderMock | null = null;
    const repo = {
      findOne: jest.fn(({ where }: { where: Partial<User> }) =>
        Promise.resolve(
          store.find((user) =>
            Object.entries(where).every(
              ([key, value]) => user[key as keyof User] === value,
            ),
          ) ?? null,
        ),
      ),
      createQueryBuilder: jest.fn((): UserQueryBuilderMock => {
        const query: UserQueryBuilderMock = {
          addSelect: jest.fn((select: string) => {
            void select;
            return query;
          }),
          where: jest.fn(
            (condition: string, parameters: Record<string, string>) => {
              void condition;
              void parameters;
              return query;
            },
          ),
          andWhere: jest.fn(
            (condition: unknown, parameters?: Record<string, unknown>) => {
              void condition;
              void parameters;
              return query;
            },
          ),
          leftJoin: jest.fn(
            (
              entity: unknown,
              alias: string,
              condition: string,
              parameters: Record<string, unknown>,
            ) => {
              void entity;
              void alias;
              void condition;
              void parameters;
              return query;
            },
          ),
          orderBy: jest.fn((sort: string, order: string) => {
            void sort;
            void order;
            return query;
          }),
          limit: jest.fn((limit: number) => {
            void limit;
            return query;
          }),
          getOne: jest.fn(() => Promise.resolve(null)),
          getMany: jest.fn(() => Promise.resolve(store)),
        };
        lastQuery = query;
        return query;
      }),
      create: jest.fn((data: Partial<User>): User => data as User),
      save: jest.fn((data: Partial<User>) => {
        const saved = {
          id: 'user-1',
          role: UserRole.User,
          status: UserStatus.Active,
          createdAt: testDate,
          updatedAt: testDate,
          ...data,
        } as User;
        const index = store.findIndex((user) => user.id === saved.id);
        if (index >= 0) {
          store[index] = saved;
        } else {
          store.push(saved);
        }
        return Promise.resolve(saved);
      }),
    };

    return {
      service: new UsersService(repo as never),
      repo,
      store,
      getLastQuery: () => lastQuery,
    };
  }

  it('creates a user with normalized email', async () => {
    const { service, repo } = createService();

    const user = await service.create({
      name: 'Ada',
      email: 'ADA@EXAMPLE.COM',
      passwordHash: 'hash',
    });

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ada@example.com',
        passwordHash: 'hash',
      }),
    );
    expect(user).toHaveProperty('passwordHash', 'hash');
  });

  it('rejects duplicate email', async () => {
    const { service } = createService([createUser({ id: 'existing' })]);

    await expect(
      service.create({
        name: 'Ada',
        email: 'ada@example.com',
        passwordHash: 'hash',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('normalizes profile updates', async () => {
    const { service } = createService([createUser()]);

    const updated = await service.updateProfile('user-1', {
      name: '  Ada Lovelace  ',
      email: '  ADA.LOVELACE@EXAMPLE.COM  ',
    });

    expect(updated).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada.lovelace@example.com',
    });
  });

  it('excludes already invited or accepted users from event search', async () => {
    const { service, getLastQuery } = createService([createUser()]);

    await service.search({
      query: 'ada',
      excludeUserId: 'current-user',
      eventId: '550e8400-e29b-41d4-a716-446655440000',
    });

    const query = getLastQuery();
    if (!query) {
      throw new Error('Expected user query builder to be created');
    }
    expect(query.leftJoin).toHaveBeenCalledWith(
      expect.any(Function),
      'participant',
      [
        'participant.user_id = user.id',
        'participant.event_id = :eventId',
        'participant.status IN (:...excludedParticipantStatuses)',
      ].join(' AND '),
      {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        excludedParticipantStatuses: ['invited', 'accepted'],
      },
    );
    expect(query.andWhere).toHaveBeenCalledWith('participant.id IS NULL');
  });
});

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'ada@example.com',
    passwordHash: 'hash',
    name: 'Ada',
    role: UserRole.User,
    status: UserStatus.Active,
    createdAt: testDate,
    updatedAt: testDate,
    ...overrides,
  };
}
