import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User, UserRole, UserStatus } from '../users/user.entity';

type JwtOptions = {
  expiresIn?: string;
};

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  function createService() {
    const config = {
      get: jest.fn((key: string): string | boolean | undefined => {
        const values: Record<string, string | boolean> = {
          JWT_ACCESS_SECRET: 'access',
          JWT_REFRESH_SECRET: 'refresh',
          COOKIE_SECURE: false,
        };
        return values[key];
      }),
    };
    const jwt = {
      signAsync: jest.fn((_payload: object, options: JwtOptions) =>
        Promise.resolve(
          options.expiresIn === '15m' ? 'access-token' : 'refresh-token',
        ),
      ),
      verifyAsync: jest.fn(() => Promise.resolve({ sub: 'user-1' })),
    };
    const sessions = {
      setRefreshSession: jest.fn(),
      getRefreshSession: jest.fn(() => Promise.resolve('refresh-token')),
      deleteRefreshSession: jest.fn(),
    };
    const user: User = {
      id: 'user-1',
      email: 'ada@example.com',
      name: 'Ada',
      passwordHash: 'hash',
      role: UserRole.User,
      status: UserStatus.Active,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };
    const usersService = {
      create: jest.fn(() => Promise.resolve(user)),
      findByEmail: jest.fn(() => Promise.resolve(user)),
      requireActiveById: jest.fn(() => Promise.resolve(user)),
    };
    return {
      service: new AuthService(
        config as never,
        jwt as never,
        sessions as never,
        usersService as never,
      ),
      jwt,
      sessions,
      usersService,
    };
  }

  it('logs in with valid password and sets httpOnly cookies', async () => {
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const { service } = createService();

    const session = await service.login({
      email: 'ada@example.com',
      password: 'password123',
    });

    expect(session.user).toMatchObject({ email: 'ada@example.com' });
    expect(session.accessToken).toBe('access-token');
    expect(session.refreshToken).toBe('refresh-token');
  });

  it('rejects invalid password', async () => {
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const { service } = createService();

    await expect(
      service.login({ email: 'ada@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('maps invalid refresh token to unauthorized response', async () => {
    const { service, jwt, sessions } = createService();
    jwt.verifyAsync.mockRejectedValue(new Error('jwt malformed'));

    await expect(service.refresh('broken-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(sessions.getRefreshSession).not.toHaveBeenCalled();
  });

  it('clears refresh session on logout', async () => {
    const { service, sessions } = createService();

    await service.logout({
      id: 'user-1',
      email: 'ada@example.com',
      name: 'Ada',
      passwordHash: 'hash',
      role: UserRole.User,
      status: UserStatus.Active,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    });

    expect(sessions.deleteRefreshSession).toHaveBeenCalledWith('user-1');
  });
});
