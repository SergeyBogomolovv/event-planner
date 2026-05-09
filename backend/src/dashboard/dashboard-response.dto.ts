import { EventResponseDto } from '../events/event-response.dto';
import { NotificationResponseDto } from '../notifications/notification-response.dto';
import { InvitationResponseDto } from '../participants/participant-response.dto';
import { EventParticipantStatus } from '../participants/event-participant.entity';
import { User } from '../users/user.entity';
import type { DashboardData } from './dashboard.service';

export class DashboardResponseDto {
  counts: DashboardData['counts'];
  upcomingEvents: EventResponseDto[];
  createdEvents: EventResponseDto[];
  participatingEvents: EventResponseDto[];
  pendingInvitations: InvitationResponseDto[];
  unreadNotifications: NotificationResponseDto[];

  constructor(data: DashboardData, currentUser: User) {
    this.counts = data.counts;
    this.upcomingEvents = data.upcomingEvents.map(
      (event) =>
        new EventResponseDto(
          event,
          currentUser,
          EventParticipantStatus.Accepted,
        ),
    );
    this.createdEvents = data.createdEvents.map(
      (event) => new EventResponseDto(event, currentUser),
    );
    this.participatingEvents = data.participatingEvents.map(
      (event) =>
        new EventResponseDto(
          event,
          currentUser,
          EventParticipantStatus.Accepted,
        ),
    );
    this.pendingInvitations = data.pendingInvitations.map(
      (participant) => new InvitationResponseDto(participant, currentUser),
    );
    this.unreadNotifications = data.unreadNotifications.map(
      (notification) => new NotificationResponseDto(notification, currentUser),
    );
  }
}
