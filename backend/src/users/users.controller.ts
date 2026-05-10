import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { CsrfGuard } from '../auth/csrf.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchUsersDto, UpdateProfileDto } from './dto';
import { User } from './user.entity';
import { UserResponseDto } from './user-response.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, CsrfGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: User) {
    return new UserResponseDto(user);
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    const updatedUser = await this.usersService.updateProfile(user.id, dto);
    return new UserResponseDto(updatedUser);
  }

  @Get('search')
  async search(@CurrentUser() user: User, @Query() dto: SearchUsersDto) {
    const users = await this.usersService.search({
      query: dto.q,
      limit: dto.limit,
      excludeUserId: user.id,
      eventId: dto.eventId,
    });
    return users.map((foundUser) => new UserResponseDto(foundUser));
  }
}
