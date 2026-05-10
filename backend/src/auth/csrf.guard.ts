import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const readCookie = (request: Request, name: string): string | undefined => {
  const cookies = (request as { cookies?: unknown }).cookies;
  if (!cookies || typeof cookies !== 'object') {
    return undefined;
  }

  const value = (cookies as Record<string, unknown>)[name];
  return typeof value === 'string' ? value : undefined;
};

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (SAFE_METHODS.has(request.method)) {
      return true;
    }

    const hasAuthCookie =
      Boolean(readCookie(request, 'access_token')) ||
      Boolean(readCookie(request, 'refresh_token'));
    if (!hasAuthCookie) {
      return true;
    }

    const csrfCookie = readCookie(request, 'csrf_token');
    const csrfHeader = request.header('x-csrf-token');
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}
