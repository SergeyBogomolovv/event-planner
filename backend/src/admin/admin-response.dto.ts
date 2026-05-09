import { EventParticipantStatus } from '../participants/event-participant.entity';
import { User, UserRole, UserStatus } from '../users/user.entity';
import { UserResponseDto } from '../users/user-response.dto';
import { Event, EventStatus } from '../events/event.entity';
import { EventResponseDto } from '../events/event-response.dto';
import { AdminEventListItem, PaginatedResult } from './admin.service';

type CountByStatus<T extends string> = Record<T, number>;

export class AdminStatsResponseDto {
  users: {
    total: number;
    byRole: CountByStatus<UserRole>;
    byStatus: CountByStatus<UserStatus>;
  };
  events: {
    total: number;
    byStatus: CountByStatus<EventStatus>;
  };
  participants: {
    total: number;
    byStatus: CountByStatus<EventParticipantStatus>;
  };

  constructor(stats: AdminStatsResponseDto) {
    this.users = stats.users;
    this.events = stats.events;
    this.participants = stats.participants;
  }
}

export class AdminUserResponseDto extends UserResponseDto {
  constructor(user: User) {
    super(user);
  }
}

export class AdminEventResponseDto extends EventResponseDto {
  participantCount: number;

  constructor(item: AdminEventListItem, currentUser: User) {
    super(item.event, currentUser);
    this.participantCount = item.participantCount;
  }
}

export class PaginatedResponseDto<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  constructor(page: Omit<PaginatedResult<unknown>, 'items'>, items: T[]) {
    this.items = items;
    this.total = page.total;
    this.page = page.page;
    this.limit = page.limit;
    this.totalPages = page.totalPages;
  }
}
