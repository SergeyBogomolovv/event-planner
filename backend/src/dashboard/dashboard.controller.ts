import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/user.entity';
import { DashboardResponseDto } from './dashboard-response.dto';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async findMine(@CurrentUser() user: User) {
    const dashboard = await this.dashboardService.findMine(user);
    return new DashboardResponseDto(dashboard, user);
  }
}
