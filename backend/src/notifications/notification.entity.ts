import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Event } from '../events/event.entity';
import { User } from '../users/user.entity';

export enum NotificationType {
  EventInvitation = 'event_invitation',
  EventUpdated = 'event_updated',
  EventCancelled = 'event_cancelled',
  ParticipantAccepted = 'participant_accepted',
  ParticipantDeclined = 'participant_declined',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { eager: true, nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ enum: NotificationType, type: 'enum' })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Index()
  @Column({ name: 'related_event_id', nullable: true, type: 'uuid' })
  relatedEventId: string | null;

  @ManyToOne(() => Event, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'related_event_id' })
  relatedEvent: Event | null;

  @Index()
  @Column({ name: 'read_at', nullable: true, type: 'timestamptz' })
  readAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
