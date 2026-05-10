import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventStatus } from '../events/event.entity';
import { Notification } from '../notifications/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  EventParticipant,
  EventParticipantStatus,
} from '../participants/event-participant.entity';
import { User } from '../users/user.entity';

export type DashboardData = {
  counts: {
    createdEvents: number;
    participatingEvents: number;
    pendingInvitations: number;
    unreadNotifications: number;
  };
  upcomingEvents: Event[];
  createdEvents: Event[];
  participatingEvents: Event[];
  pendingInvitations: EventParticipant[];
  unreadNotifications: Notification[];
};

@Injectable()
export class DashboardService {
  private readonly listLimit = 3;

  constructor(
    @InjectRepository(Event)
    private readonly events: Repository<Event>,
    @InjectRepository(EventParticipant)
    private readonly participants: Repository<EventParticipant>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findMine(user: User): Promise<DashboardData> {
    const [
      createdEventsCount,
      acceptedParticipantsCount,
      pendingInvitationsCount,
      unreadNotificationsCount,
      upcomingEvents,
      createdEvents,
      participatingEvents,
      pendingInvitations,
      unreadNotifications,
    ] = await Promise.all([
      this.countCreatedEvents(user),
      this.countAcceptedParticipants(user),
      this.countPendingInvitations(user),
      this.notificationsService.countUnread(user),
      this.findUpcomingEvents(user),
      this.findCreatedEvents(user),
      this.findParticipatingEvents(user),
      this.findPendingInvitations(user),
      this.findUnreadNotifications(user),
    ]);

    return {
      counts: {
        createdEvents: createdEventsCount,
        participatingEvents: createdEventsCount + acceptedParticipantsCount,
        pendingInvitations: pendingInvitationsCount,
        unreadNotifications: unreadNotificationsCount,
      },
      upcomingEvents,
      createdEvents,
      participatingEvents,
      pendingInvitations,
      unreadNotifications,
    };
  }

  private countCreatedEvents(user: User): Promise<number> {
    return this.events.count({ where: { organizerId: user.id } });
  }

  private countAcceptedParticipants(user: User): Promise<number> {
    return this.participants
      .createQueryBuilder('participant')
      .innerJoin('participant.event', 'event')
      .where('participant.user_id = :userId', { userId: user.id })
      .andWhere('participant.status = :status', {
        status: EventParticipantStatus.Accepted,
      })
      .andWhere('event.status = :eventStatus', {
        eventStatus: EventStatus.Active,
      })
      .getCount();
  }

  private countPendingInvitations(user: User): Promise<number> {
    return this.participants
      .createQueryBuilder('participant')
      .innerJoin('participant.event', 'event')
      .where('participant.user_id = :userId', { userId: user.id })
      .andWhere('participant.status = :status', {
        status: EventParticipantStatus.Invited,
      })
      .andWhere('event.status = :eventStatus', {
        eventStatus: EventStatus.Active,
      })
      .getCount();
  }

  private findUpcomingEvents(user: User): Promise<Event[]> {
    return this.events
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .leftJoin(
        EventParticipant,
        'participant',
        'participant.event_id = event.id AND participant.user_id = :userId AND participant.status = :status',
        { userId: user.id, status: EventParticipantStatus.Accepted },
      )
      .where('event.startsAt >= :now', { now: new Date() })
      .andWhere('event.status = :eventStatus', {
        eventStatus: EventStatus.Active,
      })
      .andWhere(
        '(event.organizer_id = :userId OR participant.id IS NOT NULL)',
        {
          userId: user.id,
        },
      )
      .orderBy('event.startsAt', 'ASC')
      .addOrderBy('event.createdAt', 'DESC')
      .take(this.listLimit)
      .getMany();
  }

  private findCreatedEvents(user: User): Promise<Event[]> {
    return this.events.find({
      where: { organizerId: user.id },
      order: { startsAt: 'ASC', createdAt: 'DESC' },
      take: this.listLimit,
    });
  }

  private findParticipatingEvents(user: User): Promise<Event[]> {
    return this.events
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .leftJoin(
        EventParticipant,
        'participant',
        'participant.event_id = event.id AND participant.user_id = :userId AND participant.status = :status',
        { userId: user.id, status: EventParticipantStatus.Accepted },
      )
      .where('event.organizer_id = :userId OR participant.id IS NOT NULL', {
        userId: user.id,
      })
      .andWhere('event.status = :eventStatus', {
        eventStatus: EventStatus.Active,
      })
      .orderBy('event.startsAt', 'ASC')
      .addOrderBy('event.createdAt', 'DESC')
      .take(this.listLimit)
      .getMany();
  }

  private findPendingInvitations(user: User): Promise<EventParticipant[]> {
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
      .andWhere('event.status = :eventStatus', {
        eventStatus: EventStatus.Active,
      })
      .orderBy('participant.invitedAt', 'DESC')
      .take(this.listLimit)
      .getMany();
  }

  private findUnreadNotifications(user: User): Promise<Notification[]> {
    return this.notificationsService.findUnreadLatest(user, this.listLimit);
  }
}
