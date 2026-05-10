import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CsrfGuard } from '../auth/csrf.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { User, UserRole } from '../users/user.entity';
import {
  AdminEventResponseDto,
  AdminStatsResponseDto,
  AdminUserResponseDto,
  PaginatedResponseDto,
} from './admin-response.dto';
import {
  AdminEventListItem,
  AdminService,
  PaginatedResult,
} from './admin.service';
import { AdminListQueryDto } from './dto';

@UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
@Roles(UserRole.Admin)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats(): Promise<AdminStatsResponseDto> {
    const stats = await this.adminService.getStats();
    return new AdminStatsResponseDto(stats);
  }

  @Get('users')
  async findUsers(
    @Query() query: AdminListQueryDto,
  ): Promise<PaginatedResponseDto<AdminUserResponseDto>> {
    const users: PaginatedResult<User> =
      await this.adminService.findUsers(query);
    return new PaginatedResponseDto<AdminUserResponseDto>(
      users,
      users.items.map((user) => new AdminUserResponseDto(user)),
    );
  }

  @Patch('users/:userId/block')
  async blockUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() currentUser: User,
  ): Promise<AdminUserResponseDto> {
    const user = await this.adminService.blockUser(userId, currentUser);
    return new AdminUserResponseDto(user);
  }

  @Patch('users/:userId/unblock')
  async unblockUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<AdminUserResponseDto> {
    const user = await this.adminService.unblockUser(userId);
    return new AdminUserResponseDto(user);
  }

  @Get('events')
  async findEvents(
    @CurrentUser() currentUser: User,
    @Query() query: AdminListQueryDto,
  ): Promise<PaginatedResponseDto<AdminEventResponseDto>> {
    const events: PaginatedResult<AdminEventListItem> =
      await this.adminService.findEvents(query);
    return new PaginatedResponseDto<AdminEventResponseDto>(
      events,
      events.items.map(
        (event) => new AdminEventResponseDto(event, currentUser),
      ),
    );
  }
}
