import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  EventParticipant,
  EventParticipantStatus,
} from '../participants/event-participant.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { User, UserRole } from '../users/user.entity';
import { CreateEventDto, UpdateEventDto } from './dto';
import { Event, EventStatus } from './event.entity';

type EventDateRange = {
  startsAt: string;
  endsAt?: string | null;
};

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly events: Repository<Event>,
    @InjectRepository(EventParticipant)
    private readonly participants: Repository<EventParticipant>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateEventDto, user: User): Promise<Event> {
    this.validateDateRange({ startsAt: dto.startsAt, endsAt: dto.endsAt });

    const event = await this.events.save(
      this.events.create({
        organizerId: user.id,
        title: dto.title.trim(),
        description: dto.description.trim(),
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        location: dto.location?.trim() || null,
        format: dto.format,
        participantLimit: dto.participantLimit ?? null,
        status: EventStatus.Draft,
      }),
    );

    return this.requireEvent(event.id);
  }

  findMine(user: User): Promise<Event[]> {
    return this.events.find({
      where: { organizerId: user.id },
      order: { startsAt: 'ASC', createdAt: 'DESC' },
    });
  }

  async findParticipating(user: User): Promise<Event[]> {
    const organizedEvents = await this.events.find({
      where: { organizerId: user.id, status: EventStatus.Active },
      order: { startsAt: 'ASC', createdAt: 'DESC' },
    });
    const participants = await this.participants
      .createQueryBuilder('participant')
      .innerJoinAndSelect('participant.event', 'event')
      .innerJoinAndSelect('event.organizer', 'organizer')
      .where('participant.user_id = :userId', { userId: user.id })
      .andWhere('participant.status = :status', {
        status: EventParticipantStatus.Accepted,
      })
      .andWhere('event.status = :eventStatus', {
        eventStatus: EventStatus.Active,
      })
      .orderBy('event.starts_at', 'ASC')
      .addOrderBy('event.created_at', 'DESC')
      .getMany();

    const eventsById = new Map<string, Event>();
    for (const event of organizedEvents) {
      eventsById.set(event.id, event);
    }
    for (const participant of participants) {
      eventsById.set(participant.event.id, participant.event);
    }

    return [...eventsById.values()].sort(
      (left, right) =>
        left.startsAt.getTime() - right.startsAt.getTime() ||
        right.createdAt.getTime() - left.createdAt.getTime(),
    );
  }

  async findOne(id: string, user: User): Promise<Event> {
    const event = await this.requireEvent(id);
    await this.assertCanView(event, user);
    return event;
  }

  getParticipantStatus(eventId: string, user: User) {
    return this.participants.findOne({
      where: { eventId, userId: user.id },
    });
  }

  async update(id: string, dto: UpdateEventDto, user: User): Promise<Event> {
    const event = await this.requireEvent(id);
    this.assertOrganizer(event, user);
    if (event.status === EventStatus.Completed) {
      throw new BadRequestException('Completed event cannot be edited');
    }

    this.validateDateRange(this.resolveDateRange(event, dto));
    this.applyUpdates(event, dto);

    const updatedEvent = await this.events.save(event);
    await this.notificationsService.notifyEventUpdated(updatedEvent);
    return updatedEvent;
  }

  async publish(id: string, user: User): Promise<Event> {
    const event = await this.requireEvent(id);
    this.assertOrganizer(event, user);
    this.assertStatus(
      event,
      [EventStatus.Draft],
      'Only draft event can be published',
    );
    event.status = EventStatus.Active;
    return this.events.save(event);
  }

  async cancel(id: string, user: User): Promise<Event> {
    const event = await this.requireEvent(id);
    this.assertOrganizer(event, user);
    this.assertStatus(
      event,
      [EventStatus.Draft, EventStatus.Active],
      'Event cannot be cancelled',
    );
    event.status = EventStatus.Cancelled;
    const cancelledEvent = await this.events.save(event);
    await this.notificationsService.notifyEventCancelled(cancelledEvent);
    return cancelledEvent;
  }

  async complete(id: string, user: User): Promise<Event> {
    const event = await this.requireEvent(id);
    this.assertOrganizer(event, user);
    this.assertStatus(
      event,
      [EventStatus.Active],
      'Only active event can be completed',
    );
    event.status = EventStatus.Completed;
    return this.events.save(event);
  }

  async remove(id: string, user: User): Promise<{ ok: true }> {
    const event = await this.requireEvent(id);
    if (!this.isOrganizer(event, user) && user.role !== UserRole.Admin) {
      throw new ForbiddenException('Only organizer or admin can delete event');
    }

    await this.events.delete(event.id);
    return { ok: true };
  }

  private async requireEvent(id: string): Promise<Event> {
    const event = await this.events.findOne({
      where: { id },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  private async assertCanView(event: Event, user: User): Promise<void> {
    if (this.isOrganizer(event, user) || user.role === UserRole.Admin) {
      return;
    }
    const participant = await this.participants.findOne({
      where: {
        eventId: event.id,
        userId: user.id,
        status: In([
          EventParticipantStatus.Invited,
          EventParticipantStatus.Accepted,
        ]),
      },
    });
    if (participant) {
      return;
    }
    throw new ForbiddenException('You do not have access to this event');
  }

  private assertOrganizer(event: Event, user: User): void {
    if (!this.isOrganizer(event, user)) {
      throw new ForbiddenException('Only organizer can manage event');
    }
  }

  private isOrganizer(event: Event, user: User): boolean {
    return event.organizerId === user.id;
  }

  private validateDateRange({ startsAt, endsAt }: EventDateRange): void {
    const start = this.parseDate(startsAt, 'Invalid start date');

    if (endsAt === undefined || endsAt === null || endsAt === '') {
      return;
    }

    const end = this.parseDate(endsAt, 'Invalid end date');
    if (end <= start) {
      throw new BadRequestException('End date must be after start date');
    }
  }

  private parseDate(value: string, errorMessage: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(errorMessage);
    }
    return date;
  }

  private resolveDateRange(event: Event, dto: UpdateEventDto): EventDateRange {
    return {
      startsAt: dto.startsAt ?? event.startsAt.toISOString(),
      endsAt:
        dto.endsAt !== undefined ? dto.endsAt : event.endsAt?.toISOString(),
    };
  }

  private applyUpdates(event: Event, dto: UpdateEventDto): void {
    if (dto.title !== undefined) {
      event.title = dto.title.trim();
    }
    if (dto.description !== undefined) {
      event.description = dto.description.trim();
    }
    if (dto.startsAt !== undefined) {
      event.startsAt = new Date(dto.startsAt);
    }
    if (dto.endsAt !== undefined) {
      event.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    }
    if (dto.location !== undefined) {
      event.location = dto.location?.trim() || null;
    }
    if (dto.format !== undefined) {
      event.format = dto.format;
    }
    if (dto.participantLimit !== undefined) {
      event.participantLimit = dto.participantLimit;
    }
  }

  private assertStatus(
    event: Event,
    statuses: EventStatus[],
    errorMessage: string,
  ): void {
    if (!statuses.includes(event.status)) {
      throw new BadRequestException(errorMessage);
    }
  }
}
