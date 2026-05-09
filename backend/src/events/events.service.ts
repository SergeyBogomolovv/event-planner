import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
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
      where: { organizerId: user.id, deletedAt: IsNull() },
      order: { startsAt: 'ASC', createdAt: 'DESC' },
    });
  }

  findParticipating(user: User): Event[] {
    void user;
    return [];
  }

  async findOne(id: string, user: User): Promise<Event> {
    const event = await this.requireEvent(id);
    this.assertCanView(event, user);
    return event;
  }

  async update(id: string, dto: UpdateEventDto, user: User): Promise<Event> {
    const event = await this.requireEvent(id);
    this.assertOrganizer(event, user);
    if (event.status === EventStatus.Completed) {
      throw new BadRequestException('Completed event cannot be edited');
    }

    this.validateDateRange(this.resolveDateRange(event, dto));
    this.applyUpdates(event, dto);

    return this.events.save(event);
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
    return this.events.save(event);
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

    await this.events.softRemove(event);
    return { ok: true };
  }

  private async requireEvent(id: string): Promise<Event> {
    const event = await this.events.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  private assertCanView(event: Event, user: User): void {
    if (this.isOrganizer(event, user) || user.role === UserRole.Admin) {
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
