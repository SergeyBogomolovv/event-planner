import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/user.entity';
import { AdminGuard } from './admin.guard';
import {
  AdminEventResponseDto,
  AdminStatsResponseDto,
  AdminUserResponseDto,
  PaginatedResponseDto,
} from './admin-response.dto';
import { AdminService } from './admin.service';
import { AdminListQueryDto } from './dto';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    const stats = await this.adminService.getStats();
    return new AdminStatsResponseDto(stats);
  }

  @Get('users')
  async findUsers(@Query() query: AdminListQueryDto) {
    const users = await this.adminService.findUsers(query);
    return new PaginatedResponseDto(
      users,
      users.items.map((user) => new AdminUserResponseDto(user)),
    );
  }

  @Patch('users/:userId/block')
  async blockUser(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: User,
  ) {
    const user = await this.adminService.blockUser(userId, currentUser);
    return new AdminUserResponseDto(user);
  }

  @Patch('users/:userId/unblock')
  async unblockUser(@Param('userId') userId: string) {
    const user = await this.adminService.unblockUser(userId);
    return new AdminUserResponseDto(user);
  }

  @Get('events')
  async findEvents(
    @CurrentUser() currentUser: User,
    @Query() query: AdminListQueryDto,
  ) {
    const events = await this.adminService.findEvents(query);
    return new PaginatedResponseDto(
      events,
      events.items.map(
        (event) => new AdminEventResponseDto(event, currentUser),
      ),
    );
  }
}
