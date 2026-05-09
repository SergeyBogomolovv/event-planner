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

export enum EmailMessageType {
  EventInvitation = 'event_invitation',
  EventUpdated = 'event_updated',
  EventCancelled = 'event_cancelled',
}

export enum EmailMessageStatus {
  Pending = 'pending',
  Sent = 'sent',
  Failed = 'failed',
}

@Entity('email_messages')
export class EmailMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column()
  email: string;

  @Column({ enum: EmailMessageType, type: 'enum' })
  type: EmailMessageType;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Index()
  @Column({
    enum: EmailMessageStatus,
    type: 'enum',
    default: EmailMessageStatus.Pending,
  })
  status: EmailMessageStatus;

  @Index()
  @Column({ name: 'related_event_id', nullable: true })
  relatedEventId: string | null;

  @ManyToOne(() => Event, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'related_event_id' })
  relatedEvent: Event | null;

  @Column({ name: 'sent_at', nullable: true, type: 'timestamptz' })
  sentAt: Date | null;

  @Column({ name: 'failed_at', nullable: true, type: 'timestamptz' })
  failedAt: Date | null;

  @Column({ name: 'failure_reason', nullable: true, type: 'text' })
  failureReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
