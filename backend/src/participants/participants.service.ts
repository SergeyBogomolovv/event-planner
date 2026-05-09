import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Event, EventStatus } from '../events/event.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/user.entity';
import {
  EventParticipant,
  EventParticipantStatus,
} from './event-participant.entity';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(EventParticipant)
    private readonly participants: Repository<EventParticipant>,
    @InjectRepository(Event)
    private readonly events: Repository<Event>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findInvitations(user: User): Promise<EventParticipant[]> {
    return this.participants
      .createQueryBuilder('participant')
      .innerJoinAndSelect('participant.event', 'event')
      .innerJoinAndSelect('event.organizer', 'organizer')
      .innerJoinAndSelect('participant.user', 'user')
      .innerJoinAndSelect('participant.invitedBy', 'invitedBy')
      .where('participant.user_id = :userId', { userId: user.id })
      .andWhere('participant.status = :status', {
        status: EventParticipantStatus.Invited,
      })
      .orderBy('participant.invitedAt', 'DESC')
      .getMany();
  }

  async invite(eventId: string, invitedUserId: string, organizer: User) {
    const event = await this.requireEvent(eventId);
    this.assertOrganizer(event, organizer);
    this.assertActive(event);

    if (invitedUserId === organizer.id) {
      throw new BadRequestException('Organizer cannot be invited');
    }

    const invitedUser = await this.users.findOne({
      where: { id: invitedUserId },
    });
    if (!invitedUser) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.participants.findOne({
      where: { eventId, userId: invitedUserId },
    });

    if (existing) {
      if (
        ![
          EventParticipantStatus.Declined,
          EventParticipantStatus.Removed,
        ].includes(existing.status)
      ) {
        throw new BadRequestException('User is already invited');
      }

      existing.status = EventParticipantStatus.Invited;
      existing.invitedById = organizer.id;
      existing.invitedBy = organizer;
      existing.invitedAt = new Date();
      existing.respondedAt = null;
      existing.removedAt = null;
      const saved = await this.participants.save(existing);
      await this.notificationsService.notifyEventInvitation(saved);
      return saved;
    }

    const participant = await this.participants.save(
      this.participants.create({
        eventId,
        event,
        userId: invitedUserId,
        user: invitedUser,
        status: EventParticipantStatus.Invited,
        invitedById: organizer.id,
        invitedBy: organizer,
        invitedAt: new Date(),
        respondedAt: null,
        removedAt: null,
      }),
    );
    await this.notificationsService.notifyEventInvitation(participant);
    return participant;
  }

  async findPublicList(eventId: string, user: User) {
    const event = await this.requireEvent(eventId);
    await this.assertCanViewParticipants(event, user);

    const accepted = await this.participants.find({
      where: {
        eventId,
        status: EventParticipantStatus.Accepted,
      },
      order: { respondedAt: 'ASC', createdAt: 'ASC' },
    });

    return { event, participants: accepted };
  }

  async findManageList(eventId: string, organizer: User) {
    const event = await this.requireEvent(eventId);
    this.assertOrganizer(event, organizer);

    const participants = await this.participants.find({
      where: { eventId },
      order: { invitedAt: 'DESC', createdAt: 'DESC' },
    });

    return { event, participants };
  }

  async accept(eventId: string, userId: string, user: User) {
    this.assertSameUser(userId, user);
    const participant = await this.requireParticipant(eventId, userId);
    this.assertActive(participant.event);

    if (participant.status === EventParticipantStatus.Accepted) {
      return participant;
    }
    if (participant.status !== EventParticipantStatus.Invited) {
      throw new BadRequestException('Invitation cannot be accepted');
    }

    await this.assertParticipantLimit(participant.event);

    participant.status = EventParticipantStatus.Accepted;
    participant.respondedAt = new Date();
    participant.removedAt = null;
    const saved = await this.participants.save(participant);
    await this.notificationsService.notifyParticipantAccepted(saved);
    return saved;
  }

  async decline(eventId: string, userId: string, user: User) {
    this.assertSameUser(userId, user);
    const participant = await this.requireParticipant(eventId, userId);

    if (participant.status === EventParticipantStatus.Declined) {
      return participant;
    }
    if (participant.status !== EventParticipantStatus.Invited) {
      throw new BadRequestException('Invitation cannot be declined');
    }

    participant.status = EventParticipantStatus.Declined;
    participant.respondedAt = new Date();
    participant.removedAt = null;
    const saved = await this.participants.save(participant);
    await this.notificationsService.notifyParticipantDeclined(saved);
    return saved;
  }

  async leave(eventId: string, userId: string, user: User) {
    this.assertSameUser(userId, user);
    const participant = await this.requireParticipant(eventId, userId);

    if (participant.status !== EventParticipantStatus.Accepted) {
      throw new BadRequestException('Only participant can leave event');
    }

    participant.status = EventParticipantStatus.Removed;
    participant.removedAt = new Date();
    return this.participants.save(participant);
  }

  async remove(eventId: string, userId: string, organizer: User) {
    const event = await this.requireEvent(eventId);
    this.assertOrganizer(event, organizer);

    if (userId === organizer.id) {
      throw new BadRequestException('Organizer cannot be removed');
    }

    const participant = await this.requireParticipant(eventId, userId);
    participant.status = EventParticipantStatus.Removed;
    participant.removedAt = new Date();
    return this.participants.save(participant);
  }

  private async requireEvent(eventId: string) {
    const event = await this.events.findOne({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  private async requireParticipant(eventId: string, userId: string) {
    const participant = await this.participants.findOne({
      where: { eventId, userId },
    });
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }
    return participant;
  }

  private assertOrganizer(event: Event, user: User): void {
    if (event.organizerId !== user.id) {
      throw new ForbiddenException('Only organizer can manage participants');
    }
  }

  private assertActive(event: Event): void {
    if (event.status !== EventStatus.Active) {
      throw new BadRequestException('Event must be active');
    }
  }

  private assertSameUser(userId: string, user: User): void {
    if (userId !== user.id) {
      throw new ForbiddenException('Action is allowed only for current user');
    }
  }

  private async assertCanViewParticipants(event: Event, user: User) {
    if (event.organizerId === user.id) {
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

    if (!participant) {
      throw new ForbiddenException('You do not have access to participants');
    }
  }

  private async assertParticipantLimit(event: Event) {
    if (!event.participantLimit) {
      return;
    }

    const acceptedCount = await this.participants.count({
      where: {
        eventId: event.id,
        status: EventParticipantStatus.Accepted,
      },
    });

    if (acceptedCount >= event.participantLimit) {
      throw new BadRequestException('Participant limit has been reached');
    }
  }
}
