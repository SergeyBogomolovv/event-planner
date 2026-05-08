import { SafeUser } from '../users/safe-user.type';
import { EventFormat, EventStatus } from './event.entity';

export type EventAction = 'edit' | 'publish' | 'cancel' | 'complete' | 'delete';

export type EventResponse = {
  id: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
  format: EventFormat;
  participantLimit: number | null;
  status: EventStatus;
  organizer: SafeUser;
  relation: {
    isOrganizer: boolean;
    isInvited: boolean;
    isParticipant: boolean;
    isAdmin: boolean;
  };
  availableActions: EventAction[];
  createdAt: Date;
  updatedAt: Date;
};
