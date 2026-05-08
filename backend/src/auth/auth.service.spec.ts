import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import type { SafeUser } from '../users/safe-user.type';
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
      toSafeUser: jest.fn(
        (input: User): SafeUser => ({
          id: input.id,
          email: input.email,
          name: input.name,
          role: input.role,
          status: input.status,
        }),
      ),
    };
    const response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    return {
      service: new AuthService(
        config as never,
        jwt as never,
        sessions as never,
        usersService as never,
      ),
      response,
      jwt,
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
      service.login(
        { email: 'ada@example.com', password: 'wrong-password' },
        response as never,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('maps invalid refresh token to unauthorized response', async () => {
    const { service, response, jwt, sessions } = createService();
    jwt.verifyAsync.mockRejectedValue(new Error('jwt malformed'));

    await expect(
      service.refresh('broken-token', response as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessions.getRefreshSession).not.toHaveBeenCalled();
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
    expect(response.clearCookie).toHaveBeenCalledWith('access_token', {
      path: '/',
    });
    expect(response.clearCookie).toHaveBeenCalledWith('refresh_token', {
      path: '/',
    });
  });
});
