import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Event } from '../events/event.entity';
import { User } from '../users/user.entity';

export enum EventParticipantStatus {
  Invited = 'invited',
  Accepted = 'accepted',
  Declined = 'declined',
  Removed = 'removed',
}

@Entity('event_participants')
@Unique('UQ_event_participants_event_user', ['eventId', 'userId'])
export class EventParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => Event, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { eager: true, nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ enum: EventParticipantStatus, type: 'enum' })
  status: EventParticipantStatus;

  @Column({ name: 'invited_by' })
  invitedById: string;

  @ManyToOne(() => User, { eager: true, nullable: false })
  @JoinColumn({ name: 'invited_by' })
  invitedBy: User;

  @Column({ name: 'invited_at', type: 'timestamptz' })
  invitedAt: Date;

  @Column({ name: 'responded_at', nullable: true, type: 'timestamptz' })
  respondedAt: Date | null;

  @Column({ name: 'removed_at', nullable: true, type: 'timestamptz' })
  removedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
