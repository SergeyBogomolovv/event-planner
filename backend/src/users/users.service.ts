import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { isUniqueViolation } from '../common/db-errors';
import {
  EventParticipant,
  EventParticipantStatus,
} from '../participants/event-participant.entity';
import { UpdateProfileDto } from './dto';
import { User, UserRole, UserStatus } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async create(params: { name: string; email: string; passwordHash: string }) {
    const email = this.normalizeEmail(params.email);
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    try {
      return await this.users.save(
        this.users.create({
          email,
          name: this.normalizeName(params.name),
          passwordHash: params.passwordHash,
          role: UserRole.User,
          status: UserStatus.Active,
        }),
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  findByEmail(email: string) {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: this.normalizeEmail(email) })
      .getOne();
  }

  findById(id: string) {
    return this.users.findOne({ where: { id } });
  }

  async requireActiveById(id: string) {
    const user = await this.findById(id);
    if (!user || user.status !== UserStatus.Active) {
      return null;
    }
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      dto.email !== undefined &&
      this.normalizeEmail(dto.email) !== user.email
    ) {
      const email = this.normalizeEmail(dto.email);
      const existing = await this.users.findOne({
        where: { email },
      });
      if (existing) {
        throw new ConflictException('Email is already registered');
      }
      user.email = email;
    }

    if (dto.name !== undefined) {
      user.name = this.normalizeName(dto.name);
    }

    try {
      return await this.users.save(user);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  search(params: {
    query: string;
    limit?: number;
    excludeUserId: string;
    eventId?: string;
  }) {
    const normalizedQuery = params.query.trim().toLowerCase();
    const limit = params.limit ?? 10;

    const queryBuilder = this.users
      .createQueryBuilder('user')
      .where('user.status = :status', { status: UserStatus.Active })
      .andWhere('user.id != :excludeUserId', {
        excludeUserId: params.excludeUserId,
      })
      .andWhere(
        new Brackets((queryBuilder) => {
          queryBuilder
            .where('LOWER(user.name) LIKE :query', {
              query: `%${normalizedQuery}%`,
            })
            .orWhere('LOWER(user.email) LIKE :query', {
              query: `%${normalizedQuery}%`,
            });
        }),
      )
      .orderBy('user.name', 'ASC')
      .limit(limit);

    if (params.eventId) {
      queryBuilder
        .leftJoin(
          EventParticipant,
          'participant',
          [
            'participant.user_id = user.id',
            'participant.event_id = :eventId',
            'participant.status IN (:...excludedParticipantStatuses)',
          ].join(' AND '),
          {
            eventId: params.eventId,
            excludedParticipantStatuses: [
              EventParticipantStatus.Invited,
              EventParticipantStatus.Accepted,
            ],
          },
        )
        .andWhere('participant.id IS NULL');
    }

    return queryBuilder.getMany();
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeName(name: string): string {
    return name.trim();
  }
}
