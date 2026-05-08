import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole, UserStatus } from './user.entity';

const testDate = new Date('2026-01-01T00:00:00Z');

describe('UsersService', () => {
  function createService(existingUser: User | null = null) {
    const repo = {
      findOne: jest.fn().mockResolvedValue(existingUser),
      create: jest.fn((data: Partial<User>): User => data as User),
      save: jest.fn((data: Partial<User>) =>
        Promise.resolve({
          id: 'user-1',
          role: UserRole.User,
          status: UserStatus.Active,
          createdAt: testDate,
          updatedAt: testDate,
          ...data,
        } as User),
      ),
    };

    return { service: new UsersService(repo as never), repo };
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
    const { service } = createService({ id: 'existing' } as User);

    await expect(
      service.create({
        name: 'Ada',
        email: 'ada@example.com',
        passwordHash: 'hash',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
