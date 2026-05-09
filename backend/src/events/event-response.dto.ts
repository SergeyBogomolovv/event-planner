import { EventParticipantStatus } from '../participants/event-participant.entity';
import { User, UserRole } from '../users/user.entity';
import { UserResponseDto } from '../users/user-response.dto';
import { Event, EventFormat, EventStatus } from './event.entity';

export type EventAction = 'edit' | 'publish' | 'cancel' | 'complete' | 'delete';

export class EventResponseDto {
  id: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
  format: EventFormat;
  participantLimit: number | null;
  status: EventStatus;
  organizer: UserResponseDto;
  relation: {
    isOrganizer: boolean;
    isInvited: boolean;
    isParticipant: boolean;
    isAdmin: boolean;
  };
  availableActions: EventAction[];
  createdAt: Date;
  updatedAt: Date;

  constructor(
    event: Event,
    currentUser: User,
    participantStatus?: EventParticipantStatus | null,
  ) {
    const isOrganizer = event.organizerId === currentUser.id;
    const isAdmin = currentUser.role === UserRole.Admin;

    this.id = event.id;
    this.title = event.title;
    this.description = event.description;
    this.startsAt = event.startsAt;
    this.endsAt = event.endsAt;
    this.location = event.location;
    this.format = event.format;
    this.participantLimit = event.participantLimit;
    this.status = event.status;
    this.organizer = new UserResponseDto(event.organizer);
    this.relation = {
      isOrganizer,
      isInvited: participantStatus === EventParticipantStatus.Invited,
      isParticipant: participantStatus === EventParticipantStatus.Accepted,
      isAdmin,
    };
    this.availableActions = this.getAvailableActions(
      event,
      isOrganizer,
      isAdmin,
    );
    this.createdAt = event.createdAt;
    this.updatedAt = event.updatedAt;
  }

  private getAvailableActions(
    event: Event,
    isOrganizer: boolean,
    isAdmin: boolean,
  ): EventAction[] {
    const actions: EventAction[] = [];

    if (isOrganizer && event.status !== EventStatus.Completed) {
      actions.push('edit');
    }
    if (isOrganizer && event.status === EventStatus.Draft) {
      actions.push('publish');
    }
    if (
      isOrganizer &&
      [EventStatus.Draft, EventStatus.Active].includes(event.status)
    ) {
      actions.push('cancel');
    }
    if (isOrganizer && event.status === EventStatus.Active) {
      actions.push('complete');
    }
    if (isOrganizer || isAdmin) {
      actions.push('delete');
    }

    return actions;
  }
}
