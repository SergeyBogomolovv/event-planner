import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
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
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.register(dto, response);
    return new UserResponseDto(user);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.login(dto, response);
    return new UserResponseDto(user);
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.refresh(
      readCookie(request, 'refresh_token'),
      response,
    );
    return new UserResponseDto(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logout(user, response);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: User) {
    return new UserResponseDto(user);
  }
}
