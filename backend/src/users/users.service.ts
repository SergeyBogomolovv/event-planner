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
    const email = params.email.toLowerCase();
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const user = await this.users.save(
      this.users.create({
        email,
        name: params.name,
        passwordHash: params.passwordHash,
        role: UserRole.User,
        status: UserStatus.Active,
      }),
    );

    return user;
  }

  findByEmail(email: string) {
    return this.users.findOne({ where: { email: email.toLowerCase() } });
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

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existing = await this.users.findOne({
        where: { email: dto.email.toLowerCase() },
      });
      if (existing) {
        throw new ConflictException('Email is already registered');
      }
      user.email = dto.email.toLowerCase();
    }

    if (dto.name) {
      user.name = dto.name;
    }

    return this.toSafeUser(await this.users.save(user));
  }
}
