import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
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

    const user = await this.users.save(
      this.users.create({
        email,
        name: this.normalizeName(params.name),
        passwordHash: params.passwordHash,
        role: UserRole.User,
        status: UserStatus.Active,
      }),
    );

    return user;
  }

  findByEmail(email: string) {
    return this.users.findOne({ where: { email: this.normalizeEmail(email) } });
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

    return this.users.save(user);
  }

  search(params: { query: string; limit?: number; excludeUserId: string }) {
    const normalizedQuery = params.query.trim().toLowerCase();
    const limit = params.limit ?? 10;

    return this.users
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
      .limit(limit)
      .getMany();
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeName(name: string): string {
    return name.trim();
  }
}
