import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from './dto';
import { SafeUser } from './safe-user.type';
import { User, UserRole, UserStatus } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

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

    return this.toSafeUser(await this.users.save(user));
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeName(name: string): string {
    return name.trim();
  }
}
