import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { SafeUser } from '../users/safe-user.type';
import { CreateEventDto, UpdateEventDto } from './dto';
import { EventsService } from './events.service';

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@Body() dto: CreateEventDto, @CurrentUser() user: SafeUser) {
    return this.eventsService.create(dto, user);
  }

  @Get('my')
  findMine(@CurrentUser() user: SafeUser) {
    return this.eventsService.findMine(user);
  }

  @Get('participating')
  findParticipating(@CurrentUser() user: SafeUser) {
    return this.eventsService.findParticipating(user);
  }

  @Get(':eventId')
  findOne(@Param('eventId') eventId: string, @CurrentUser() user: SafeUser) {
    return this.eventsService.findOne(eventId, user);
  }

  @Patch(':eventId')
  update(
    @Param('eventId') eventId: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.eventsService.update(eventId, dto, user);
  }

  @Post(':eventId/publish')
  publish(@Param('eventId') eventId: string, @CurrentUser() user: SafeUser) {
    return this.eventsService.publish(eventId, user);
  }

  @Post(':eventId/cancel')
  cancel(@Param('eventId') eventId: string, @CurrentUser() user: SafeUser) {
    return this.eventsService.cancel(eventId, user);
  }

  @Post(':eventId/complete')
  complete(@Param('eventId') eventId: string, @CurrentUser() user: SafeUser) {
    return this.eventsService.complete(eventId, user);
  }

  @Delete(':eventId')
  remove(@Param('eventId') eventId: string, @CurrentUser() user: SafeUser) {
    return this.eventsService.remove(eventId, user);
  }
}
