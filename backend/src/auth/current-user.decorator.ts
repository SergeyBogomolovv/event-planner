import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { SafeUser } from '../users/safe-user.type';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SafeUser => {
    const request = context.switchToHttp().getRequest<{ user: SafeUser }>();
    return request.user;
  },
);
