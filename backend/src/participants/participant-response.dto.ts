import { EventResponseDto } from '../events/event-response.dto';
import { Event } from '../events/event.entity';
import { User } from '../users/user.entity';
import { UserResponseDto } from '../users/user-response.dto';
import {
  EventParticipant,
  EventParticipantStatus,
} from './event-participant.entity';

export type ParticipantRole = 'organizer' | 'participant';

export class ParticipantResponseDto {
  id: string;
  role: ParticipantRole;
  status: EventParticipantStatus | 'accepted';
  user: UserResponseDto;
  invitedBy: UserResponseDto | null;
  invitedAt: Date | null;
  respondedAt: Date | null;
  removedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;

  constructor(participant: EventParticipant) {
    this.id = participant.id;
    this.role = 'participant';
    this.status = participant.status;
    this.user = new UserResponseDto(participant.user);
    this.invitedBy = new UserResponseDto(participant.invitedBy);
    this.invitedAt = participant.invitedAt;
    this.respondedAt = participant.respondedAt;
    this.removedAt = participant.removedAt;
    this.createdAt = participant.createdAt;
    this.updatedAt = participant.updatedAt;
  }

  static organizer(event: Event): ParticipantResponseDto {
    const dto = Object.create(
      ParticipantResponseDto.prototype,
    ) as ParticipantResponseDto;
    dto.id = event.organizerId;
    dto.role = 'organizer';
    dto.status = 'accepted';
    dto.user = new UserResponseDto(event.organizer);
    dto.invitedBy = null;
    dto.invitedAt = null;
    dto.respondedAt = null;
    dto.removedAt = null;
    dto.createdAt = event.createdAt;
    dto.updatedAt = event.updatedAt;
    return dto;
  }
}

export class InvitationResponseDto {
  id: string;
  status: EventParticipantStatus;
  event: EventResponseDto;
  invitedBy: UserResponseDto;
  invitedAt: Date;
  respondedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(participant: EventParticipant, currentUser: User) {
    this.id = participant.id;
    this.status = participant.status;
    this.event = new EventResponseDto(
      participant.event,
      currentUser,
      participant.status,
    );
    this.invitedBy = new UserResponseDto(participant.invitedBy);
    this.invitedAt = participant.invitedAt;
    this.respondedAt = participant.respondedAt;
    this.createdAt = participant.createdAt;
    this.updatedAt = participant.updatedAt;
  }
}
