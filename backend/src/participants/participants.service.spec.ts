import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { Event, EventFormat, EventStatus } from '../events/event.entity';
import { User, UserRole, UserStatus } from '../users/user.entity';
import {
  EventParticipant,
  EventParticipantStatus,
} from './event-participant.entity';
import { ParticipantsService } from './participants.service';

const now = new Date('2026-01-01T00:00:00Z');

const organizerUser = createUser({
  id: 'organizer-1',
  email: 'organizer@example.com',
  name: 'Organizer',
});

const invitedUser = createUser({
  id: 'user-1',
  email: 'user@example.com',
  name: 'User',
});

const otherUser = createUser({
  id: 'user-2',
  email: 'other@example.com',
  name: 'Other',
});

type ParticipantsQueryBuilderMock = {
  innerJoinAndSelect: jest.MockedFunction<() => ParticipantsQueryBuilderMock>;
  where: jest.MockedFunction<() => ParticipantsQueryBuilderMock>;
  andWhere: jest.MockedFunction<() => ParticipantsQueryBuilderMock>;
  orderBy: jest.MockedFunction<() => ParticipantsQueryBuilderMock>;
  getMany: jest.MockedFunction<() => Promise<EventParticipant[]>>;
};

describe('ParticipantsService', () => {
  function createService(params: {
    events?: Event[];
    users?: User[];
    participants?: EventParticipant[];
  }) {
    const eventsStore = params.events ?? [createEvent()];
    const usersStore = params.users ?? [organizerUser, invitedUser, otherUser];
    const participantsStore = [...(params.participants ?? [])];

    const participantsRepo = {
      create: jest.fn((data: Partial<EventParticipant>): EventParticipant => {
        const event = eventsStore.find((item) => item.id === data.eventId);
        const user = usersStore.find((item) => item.id === data.userId);
        const invitedBy = usersStore.find(
          (item) => item.id === data.invitedById,
        );

        return {
          id: `participant-${participantsStore.length + 1}`,
          event: event as Event,
          user: user as User,
          invitedBy: invitedBy as User,
          createdAt: now,
          updatedAt: now,
          ...data,
        } as EventParticipant;
      }),
      save: jest.fn((participant: EventParticipant) => {
        const saved = {
          ...participant,
          id: participant.id ?? `participant-${participantsStore.length + 1}`,
          createdAt: participant.createdAt ?? now,
          updatedAt: now,
        };
        const index = participantsStore.findIndex(
          (item) => item.id === saved.id,
        );
        if (index >= 0) {
          participantsStore[index] = saved;
        } else {
          participantsStore.push(saved);
        }
        return Promise.resolve(saved);
      }),
      find: jest.fn(({ where }: { where: Partial<EventParticipant> }) =>
        Promise.resolve(
          participantsStore.filter((participant) =>
            Object.entries(where).every(([key, value]) => {
              if (key === 'event') {
                return participant.event.deletedAt === null;
              }
              return participant[key as keyof EventParticipant] === value;
            }),
          ),
        ),
      ),
      findOne: jest.fn(({ where }: { where: Partial<EventParticipant> }) =>
        Promise.resolve(
          participantsStore.find((participant) =>
            Object.entries(where).every(
              ([key, value]) =>
                participant[key as keyof EventParticipant] === value,
            ),
          ) ?? null,
        ),
      ),
      count: jest.fn(({ where }: { where: Partial<EventParticipant> }) =>
        Promise.resolve(
          participantsStore.filter((participant) =>
            Object.entries(where).every(
              ([key, value]) =>
                participant[key as keyof EventParticipant] === value,
            ),
          ).length,
        ),
      ),
      createQueryBuilder: jest.fn(() => {
        const query: ParticipantsQueryBuilderMock = {
          innerJoinAndSelect: jest.fn(() => query),
          where: jest.fn(() => query),
          andWhere: jest.fn(() => query),
          orderBy: jest.fn(() => query),
          getMany: jest.fn(() =>
            Promise.resolve(
              participantsStore
                .filter(
                  (participant) =>
                    participant.userId === invitedUser.id &&
                    participant.status === EventParticipantStatus.Invited &&
                    participant.event.deletedAt === null,
                )
                .sort(
                  (left, right) =>
                    right.invitedAt.getTime() - left.invitedAt.getTime(),
                ),
            ),
          ),
        };

        return query;
      }),
    };

    const eventsRepo = {
      findOne: jest.fn(({ where }: { where: Partial<Event> }) =>
        Promise.resolve(
          eventsStore.find(
            (event) => event.id === where.id && event.deletedAt === null,
          ) ?? null,
        ),
      ),
    };

    const usersRepo = {
      findOne: jest.fn(({ where }: { where: Partial<User> }) =>
        Promise.resolve(
          usersStore.find((user) => user.id === where.id) ?? null,
        ),
      ),
    };

    return {
      service: new ParticipantsService(
        participantsRepo as unknown as Repository<EventParticipant>,
        eventsRepo as unknown as Repository<Event>,
        usersRepo as unknown as Repository<User>,
      ),
      participantsStore,
    };
  }

  it('allows organizer to invite registered user', async () => {
    const { service, participantsStore } = createService({});

    const participant = await service.invite(
      'event-1',
      invitedUser.id,
      organizerUser,
    );

    expect(participant.status).toBe(EventParticipantStatus.Invited);
    expect(participantsStore).toHaveLength(1);
  });

  it('prevents non-organizer from inviting', async () => {
    const { service } = createService({});

    await expect(
      service.invite('event-1', invitedUser.id, otherUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows invited user to accept invitation', async () => {
    const participant = createParticipant();
    const { service } = createService({ participants: [participant] });

    const accepted = await service.accept(
      'event-1',
      invitedUser.id,
      invitedUser,
    );

    expect(accepted.status).toBe(EventParticipantStatus.Accepted);
    expect(accepted.respondedAt).toBeInstanceOf(Date);
  });

  it('does not exceed participant limit', async () => {
    const event = createEvent({ participantLimit: 1 });
    const { service } = createService({
      events: [event],
      participants: [
        createParticipant({
          id: 'accepted-1',
          event,
          userId: otherUser.id,
          user: otherUser,
          status: EventParticipantStatus.Accepted,
        }),
        createParticipant({ event }),
      ],
    });

    await expect(
      service.accept('event-1', invitedUser.id, invitedUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('hides declined and removed from public list', async () => {
    const accepted = createParticipant({
      id: 'accepted-1',
      userId: invitedUser.id,
      user: invitedUser,
      status: EventParticipantStatus.Accepted,
    });
    const declined = createParticipant({
      id: 'declined-1',
      userId: otherUser.id,
      user: otherUser,
      status: EventParticipantStatus.Declined,
    });
    const { service } = createService({ participants: [accepted, declined] });

    const result = await service.findPublicList('event-1', organizerUser);

    expect(result.participants).toHaveLength(1);
    expect(result.participants[0].id).toBe('accepted-1');
  });

  it('hides invitations for deleted events', async () => {
    const deletedEvent = createEvent({
      id: 'deleted-event',
      deletedAt: now,
    });
    const activeEvent = createEvent({ id: 'active-event' });
    const { service } = createService({
      events: [deletedEvent, activeEvent],
      participants: [
        createParticipant({
          id: 'deleted-invitation',
          eventId: deletedEvent.id,
          event: deletedEvent,
        }),
        createParticipant({
          id: 'active-invitation',
          eventId: activeEvent.id,
          event: activeEvent,
        }),
      ],
    });

    const invitations = await service.findInvitations(invitedUser);

    expect(invitations).toHaveLength(1);
    expect(invitations[0].id).toBe('active-invitation');
  });
});

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: 'hash',
    name: 'User',
    role: UserRole.User,
    status: UserStatus.Active,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'event-1',
    organizerId: organizerUser.id,
    organizer: organizerUser,
    title: 'Planning Session',
    description: 'Quarter planning',
    startsAt: new Date('2026-06-01T10:00:00.000Z'),
    endsAt: null,
    location: null,
    format: EventFormat.Online,
    participantLimit: null,
    status: EventStatus.Active,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

function createParticipant(
  overrides: Partial<EventParticipant> = {},
): EventParticipant {
  return {
    id: 'participant-1',
    eventId: 'event-1',
    event: createEvent(),
    userId: invitedUser.id,
    user: invitedUser,
    status: EventParticipantStatus.Invited,
    invitedById: organizerUser.id,
    invitedBy: organizerUser,
    invitedAt: now,
    respondedAt: null,
    removedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
