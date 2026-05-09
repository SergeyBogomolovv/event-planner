import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventStatus } from '../events/event.entity';
import {
  EventParticipant,
  EventParticipantStatus,
} from '../participants/event-participant.entity';
import { User, UserRole, UserStatus } from '../users/user.entity';

export type AdminStats = {
  users: {
    total: number;
    byRole: Record<UserRole, number>;
    byStatus: Record<UserStatus, number>;
  };
  events: {
    total: number;
    byStatus: Record<EventStatus, number>;
  };
  participants: {
    total: number;
    byStatus: Record<EventParticipantStatus, number>;
  };
};

export type AdminEventListItem = {
  event: Event;
  participantCount: number;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AdminListParams = {
  page: number;
  limit: number;
};

type CountRow<T extends string> = {
  key: T;
  count: string;
};

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Event)
    private readonly events: Repository<Event>,
    @InjectRepository(EventParticipant)
    private readonly participants: Repository<EventParticipant>,
  ) {}

  async getStats(): Promise<AdminStats> {
    const [
      usersTotal,
      userRoleRows,
      userStatusRows,
      eventsTotal,
      eventStatusRows,
      participantsTotal,
      participantStatusRows,
    ] = await Promise.all([
      this.users.count(),
      this.countGrouped<UserRole>(this.users, 'user', 'user.role'),
      this.countGrouped<UserStatus>(this.users, 'user', 'user.status'),
      this.events.count(),
      this.countGrouped<EventStatus>(this.events, 'event', 'event.status'),
      this.participants.count(),
      this.countGrouped<EventParticipantStatus>(
        this.participants,
        'participant',
        'participant.status',
      ),
    ]);

    return {
      users: {
        total: usersTotal,
        byRole: this.fillCounts(UserRole, userRoleRows),
        byStatus: this.fillCounts(UserStatus, userStatusRows),
      },
      events: {
        total: eventsTotal,
        byStatus: this.fillCounts(EventStatus, eventStatusRows),
      },
      participants: {
        total: participantsTotal,
        byStatus: this.fillCounts(
          EventParticipantStatus,
          participantStatusRows,
        ),
      },
    };
  }

  async findUsers(params: AdminListParams): Promise<PaginatedResult<User>> {
    const [items, total] = await this.users.findAndCount({
      order: { createdAt: 'DESC' },
      skip: this.resolveOffset(params),
      take: params.limit,
    });

    return this.buildPage(items, total, params);
  }

  async blockUser(userId: string, currentUser: User): Promise<User> {
    if (userId === currentUser.id) {
      throw new BadRequestException('Admin cannot block own account');
    }

    const user = await this.requireUser(userId);
    user.status = UserStatus.Blocked;
    return this.users.save(user);
  }

  async unblockUser(userId: string): Promise<User> {
    const user = await this.requireUser(userId);
    user.status = UserStatus.Active;
    return this.users.save(user);
  }

  async findEvents(
    params: AdminListParams,
  ): Promise<PaginatedResult<AdminEventListItem>> {
    const [events, total] = await this.events.findAndCount({
      order: { createdAt: 'DESC' },
      skip: this.resolveOffset(params),
      take: params.limit,
    });
    const counts = await this.countAcceptedParticipants(
      events.map((event) => event.id),
    );

    const items = events.map((event) => ({
      event,
      participantCount: counts.get(event.id) ?? 0,
    }));

    return this.buildPage(items, total, params);
  }

  private async requireUser(userId: string): Promise<User> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async countGrouped<T extends string>(
    repository:
      | Repository<User>
      | Repository<Event>
      | Repository<EventParticipant>,
    alias: string,
    column: string,
  ): Promise<CountRow<T>[]> {
    return repository
      .createQueryBuilder(alias)
      .select(column, 'key')
      .addSelect('COUNT(*)', 'count')
      .groupBy(column)
      .getRawMany<CountRow<T>>();
  }

  private fillCounts<T extends string>(
    values: Record<string, T>,
    rows: CountRow<T>[],
  ): Record<T, number> {
    const counts = Object.fromEntries(
      Object.values(values).map((value) => [value, 0]),
    ) as Record<T, number>;

    for (const row of rows) {
      counts[row.key] = Number(row.count);
    }

    return counts;
  }

  private async countAcceptedParticipants(
    eventIds: string[],
  ): Promise<Map<string, number>> {
    if (eventIds.length === 0) {
      return new Map();
    }

    const rows = await this.participants
      .createQueryBuilder('participant')
      .select('participant.event_id', 'eventId')
      .addSelect('COUNT(*)', 'count')
      .where('participant.event_id IN (:...eventIds)', { eventIds })
      .andWhere('participant.status = :status', {
        status: EventParticipantStatus.Accepted,
      })
      .groupBy('participant.event_id')
      .getRawMany<{ eventId: string; count: string }>();

    return new Map(rows.map((row) => [row.eventId, Number(row.count)]));
  }

  private resolveOffset({ page, limit }: AdminListParams): number {
    return (page - 1) * limit;
  }

  private buildPage<T>(
    items: T[],
    total: number,
    { page, limit }: AdminListParams,
  ): PaginatedResult<T> {
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
