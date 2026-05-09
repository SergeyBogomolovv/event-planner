import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { UserRole, UserStatus } from '../users/user.entity';

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('allows admin users', () => {
    expect(guard.canActivate(createContext(UserRole.Admin))).toBe(true);
  });

  it('rejects non-admin users', () => {
    expect(() => guard.canActivate(createContext(UserRole.User))).toThrow(
      ForbiddenException,
    );
  });
});

function createContext(role: UserRole): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          passwordHash: 'hash',
          name: 'User',
          role,
          status: UserStatus.Active,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-01T00:00:00Z'),
        },
      }),
    }),
  } as ExecutionContext;
}
