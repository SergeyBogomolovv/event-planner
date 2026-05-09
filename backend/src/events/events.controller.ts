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
import { User } from '../users/user.entity';
import { CreateEventDto, UpdateEventDto } from './dto';
import { EventResponseDto } from './event-response.dto';
import { EventsService } from './events.service';

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  async create(@Body() dto: CreateEventDto, @CurrentUser() user: User) {
    const event = await this.eventsService.create(dto, user);
    return new EventResponseDto(event, user);
  }

  @Get('my')
  async findMine(@CurrentUser() user: User) {
    const events = await this.eventsService.findMine(user);
    return events.map((event) => new EventResponseDto(event, user));
  }

  @Get('participating')
  findParticipating(@CurrentUser() user: User) {
    return this.eventsService
      .findParticipating(user)
      .map((event) => new EventResponseDto(event, user));
  }

  @Get(':eventId')
  async findOne(@Param('eventId') eventId: string, @CurrentUser() user: User) {
    const event = await this.eventsService.findOne(eventId, user);
    return new EventResponseDto(event, user);
  }

  @Patch(':eventId')
  async update(
    @Param('eventId') eventId: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: User,
  ) {
    const event = await this.eventsService.update(eventId, dto, user);
    return new EventResponseDto(event, user);
  }

  @Post(':eventId/publish')
  async publish(@Param('eventId') eventId: string, @CurrentUser() user: User) {
    const event = await this.eventsService.publish(eventId, user);
    return new EventResponseDto(event, user);
  }

  @Post(':eventId/cancel')
  async cancel(@Param('eventId') eventId: string, @CurrentUser() user: User) {
    const event = await this.eventsService.cancel(eventId, user);
    return new EventResponseDto(event, user);
  }

  @Post(':eventId/complete')
  async complete(@Param('eventId') eventId: string, @CurrentUser() user: User) {
    const event = await this.eventsService.complete(eventId, user);
    return new EventResponseDto(event, user);
  }

  @Delete(':eventId')
  remove(@Param('eventId') eventId: string, @CurrentUser() user: User) {
    return this.eventsService.remove(eventId, user);
  }
}
