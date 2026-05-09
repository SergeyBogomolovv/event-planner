import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions } from 'express';
import type { Request, Response } from 'express';
import {
  ACCESS_MAX_AGE_MS,
  AuthService,
  REFRESH_MAX_AGE_MS,
  type AuthSession,
} from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto, RegisterDto } from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from '../users/user.entity';
import { UserResponseDto } from '../users/user-response.dto';

const readCookie = (request: Request, name: string): string | undefined => {
  const cookies = (request as { cookies?: unknown }).cookies;
  if (!cookies || typeof cookies !== 'object') {
    return undefined;
  }

  const value = (cookies as Record<string, unknown>)[name];
  return typeof value === 'string' ? value : undefined;
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.register(dto);
    this.setAuthCookies(response, session);
    return new UserResponseDto(session.user);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(dto);
    this.setAuthCookies(response, session);
    return new UserResponseDto(session.user);
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.refresh(
      readCookie(request, 'refresh_token'),
    );
    this.setAuthCookies(response, session);
    return new UserResponseDto(session.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.logout(user);
    this.clearAuthCookies(response);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: User) {
    return new UserResponseDto(user);
  }

  private setAuthCookies(response: Response, session: AuthSession): void {
    response.cookie('access_token', session.accessToken, {
      ...this.cookieOptions(),
      maxAge: ACCESS_MAX_AGE_MS,
    });
    response.cookie('refresh_token', session.refreshToken, {
      ...this.cookieOptions(),
      maxAge: REFRESH_MAX_AGE_MS,
    });
  }

  private clearAuthCookies(response: Response): void {
    response.clearCookie('access_token', this.cookieOptions());
    response.clearCookie('refresh_token', this.cookieOptions());
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get<boolean>('COOKIE_SECURE') ?? false,
      path: '/',
    };
  }
}
