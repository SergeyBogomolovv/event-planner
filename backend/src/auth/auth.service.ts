import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './dto';
import { RedisSessionService } from './redis-session.service';
import { User, UserStatus } from '../users/user.entity';
import { UsersService } from '../users/users.service';

export const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
export const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

type JwtPayload = {
  sub: string;
};

export type AuthSession = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly sessions: RedisSessionService,
    private readonly usersService: UsersService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthSession> {
    const passwordHash: string = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    return this.issueSession(user);
  }

  async login(dto: LoginDto): Promise<AuthSession> {
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

    return this.issueSession(user);
  }

  async refresh(refreshToken: string | undefined): Promise<AuthSession> {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const payload = await this.verifyRefreshToken(refreshToken);
    const storedToken = await this.sessions.getRefreshSession(payload.sub);
    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh session');
    }

    const user = await this.usersService.requireActiveById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User is not allowed');
    }

    return this.issueSession(user);
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      return await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.getRefreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(user: User): Promise<{ ok: true }> {
    await this.sessions.deleteRefreshSession(user.id);
    return { ok: true };
  }

  private async issueSession(user: User): Promise<AuthSession> {
    const accessToken: string = await this.jwt.signAsync(
      { sub: user.id },
      {
        secret: this.getAccessSecret(),
        expiresIn: '15m',
      },
    );
    const refreshToken: string = await this.jwt.signAsync(
      { sub: user.id },
      {
        secret: this.getRefreshSecret(),
        expiresIn: '7d',
      },
    );

    await this.sessions.setRefreshSession(
      user.id,
      refreshToken,
      REFRESH_TTL_SECONDS,
    );

    return { user, accessToken, refreshToken };
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
}
