import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserRole, UserStatus } from '../users/user.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  function createService() {
    const config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string | boolean> = {
          JWT_ACCESS_SECRET: 'access',
          JWT_REFRESH_SECRET: 'refresh',
          COOKIE_SECURE: false,
        };
        return values[key];
      }),
    };
    const jwt = {
      signAsync: jest.fn(async (_payload, options) =>
        options.expiresIn === '15m' ? 'access-token' : 'refresh-token',
      ),
      verifyAsync: jest.fn(async () => ({ sub: 'user-1' })),
    };
    const sessions = {
      setRefreshSession: jest.fn(),
      getRefreshSession: jest.fn(async () => 'refresh-token'),
      deleteRefreshSession: jest.fn(),
    };
    const user = {
      id: 'user-1',
      email: 'ada@example.com',
      name: 'Ada',
      passwordHash: 'hash',
      role: UserRole.User,
      status: UserStatus.Active,
    };
    const usersService = {
      create: jest.fn(async () => user),
      findByEmail: jest.fn(async () => user),
      requireActiveById: jest.fn(async () => user),
      toSafeUser: jest.fn((input) => ({
        id: input.id,
        email: input.email,
        name: input.name,
        role: input.role,
        status: input.status,
      })),
    };
    const response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    return {
      service: new AuthService(config as never, jwt as never, sessions as never, usersService as never),
      response,
      sessions,
      usersService,
    };
  }

  it('logs in with valid password and sets httpOnly cookies', async () => {
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const { service, response } = createService();

    const user = await service.login(
      { email: 'ada@example.com', password: 'password123' },
      response as never,
    );

    expect(user).toMatchObject({ email: 'ada@example.com' });
    expect(response.cookie).toHaveBeenCalledWith(
      'access_token',
      'access-token',
      expect.objectContaining({ httpOnly: true, maxAge: 15 * 60 * 1000 }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-token',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('rejects invalid password', async () => {
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const { service, response } = createService();

    await expect(
      service.login({ email: 'ada@example.com', password: 'wrong-password' }, response as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('clears refresh session on logout', async () => {
    const { service, response, sessions } = createService();

    await service.logout(
      {
        id: 'user-1',
        email: 'ada@example.com',
        name: 'Ada',
        role: UserRole.User,
        status: UserStatus.Active,
      },
      response as never,
    );

    expect(sessions.deleteRefreshSession).toHaveBeenCalledWith('user-1');
    expect(response.clearCookie).toHaveBeenCalledWith('access_token', { path: '/' });
    expect(response.clearCookie).toHaveBeenCalledWith('refresh_token', { path: '/' });
  });
});
