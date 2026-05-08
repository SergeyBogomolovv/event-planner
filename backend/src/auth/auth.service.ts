import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { LoginDto, RegisterDto } from './dto';
import { RedisSessionService } from './redis-session.service';
import type { SafeUser } from '../users/safe-user.type';
import { UserStatus } from '../users/user.entity';
import { UsersService } from '../users/users.service';

const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

type JwtPayload = {
  sub: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly sessions: RedisSessionService,
    private readonly usersService: UsersService,
  ) {}

  async register(dto: RegisterDto, response: Response): Promise<SafeUser> {
    const passwordHash: string = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    await this.issueCookies(user.id, response);
    return this.usersService.toSafeUser(user);
  }

  async login(dto: LoginDto, response: Response): Promise<SafeUser> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || user.status === UserStatus.Blocked) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const validPassword: boolean = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!validPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.issueCookies(user.id, response);
    return this.usersService.toSafeUser(user);
  }

  async refresh(
    refreshToken: string | undefined,
    response: Response,
  ): Promise<SafeUser> {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
      secret: this.getRefreshSecret(),
    });
    const storedToken = await this.sessions.getRefreshSession(payload.sub);
    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh session');
    }

    const user = await this.usersService.requireActiveById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User is not allowed');
    }

    await this.issueCookies(user.id, response);
    return this.usersService.toSafeUser(user);
  }

  async logout(user: SafeUser, response: Response): Promise<{ ok: true }> {
    await this.sessions.deleteRefreshSession(user.id);
    this.clearCookies(response);
    return { ok: true };
  }

  private async issueCookies(
    userId: string,
    response: Response,
  ): Promise<void> {
    const accessToken: string = await this.jwt.signAsync(
      { sub: userId },
      {
        secret: this.getAccessSecret(),
        expiresIn: '15m',
      },
    );
    const refreshToken: string = await this.jwt.signAsync(
      { sub: userId },
      {
        secret: this.getRefreshSecret(),
        expiresIn: '7d',
      },
    );

    await this.sessions.setRefreshSession(
      userId,
      refreshToken,
      REFRESH_TTL_SECONDS,
    );

    const secure = this.config.get<boolean>('COOKIE_SECURE') ?? false;
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge: ACCESS_MAX_AGE_MS,
      path: '/',
    });
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge: REFRESH_MAX_AGE_MS,
      path: '/',
    });
  }

  private getAccessSecret(): string {
    return (
      this.config.get<string>('JWT_ACCESS_SECRET') ??
      'dev-access-secret-change-me'
    );
  }

  private getRefreshSecret(): string {
    return (
      this.config.get<string>('JWT_REFRESH_SECRET') ??
      'dev-refresh-secret-change-me'
    );
  }

  private clearCookies(response: Response): void {
    response.clearCookie('access_token', { path: '/' });
    response.clearCookie('refresh_token', { path: '/' });
  }
}
