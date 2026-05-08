import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole, UserStatus } from './user.entity';

const testDate = new Date('2026-01-01T00:00:00Z');

describe('UsersService', () => {
  function createService(existingUsers: User[] = []) {
    const store = [...existingUsers];
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

    return { service: new UsersService(repo as never), repo, store };
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
    expect(service.toSafeUser(user)).not.toHaveProperty('passwordHash');
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
