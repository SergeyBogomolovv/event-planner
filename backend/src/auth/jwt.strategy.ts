import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

const readCookie = (request: Request, name: string): string | null => {
  const cookies = (request as { cookies?: unknown }).cookies;
  if (!cookies || typeof cookies !== 'object') {
    return null;
  }

  const value = (cookies as Record<string, unknown>)[name];
  return typeof value === 'string' ? value : null;
};

const cookieExtractor = (request: Request): string | null =>
  readCookie(request, 'access_token');

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey:
        config.get<string>('JWT_ACCESS_SECRET') ??
        'dev-access-secret-change-me',
    });
  }

  async validate(payload: { sub: string }) {
    const user = await this.usersService.requireActiveById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User is not allowed');
    }

    return user;
  }
}
