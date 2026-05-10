import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum EventStatus {
  Draft = 'draft',
  Active = 'active',
  Cancelled = 'cancelled',
  Completed = 'completed',
}

export enum EventFormat {
  Offline = 'offline',
  Online = 'online',
  Hybrid = 'hybrid',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'organizer_id', type: 'uuid' })
  organizerId: string;

  @ManyToOne(() => User, { eager: true, nullable: false })
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Index()
  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Column({ name: 'ends_at', nullable: true, type: 'timestamptz' })
  endsAt: Date | null;

  @Column({ nullable: true, type: 'varchar' })
  location: string | null;

  @Column({ enum: EventFormat, type: 'enum' })
  format: EventFormat;

  @Column({ name: 'participant_limit', nullable: true, type: 'integer' })
  participantLimit: number | null;

  @Index()
  @Column({ enum: EventStatus, type: 'enum', default: EventStatus.Draft })
  status: EventStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
