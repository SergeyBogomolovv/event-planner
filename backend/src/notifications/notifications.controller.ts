import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CsrfGuard } from '../auth/csrf.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/user.entity';
import { NotificationResponseDto } from './notification-response.dto';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard, CsrfGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findMine(@CurrentUser() user: User) {
    const notifications = await this.notificationsService.findMine(user);
    return notifications.map(
      (notification) => new NotificationResponseDto(notification, user),
    );
  }

  @Get('unread-count')
  async countUnread(@CurrentUser() user: User) {
    const count = await this.notificationsService.countUnread(user);
    return { count };
  }

  @Patch(':notificationId/read')
  async markRead(
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
    @CurrentUser() user: User,
  ) {
    const notification = await this.notificationsService.markRead(
      notificationId,
      user,
    );
    return new NotificationResponseDto(notification, user);
  }
}
