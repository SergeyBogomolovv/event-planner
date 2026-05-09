import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { Queue } from 'bullmq';
import { createTransport, type Transporter } from 'nodemailer';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import {
  EmailMessage,
  EmailMessageStatus,
  EmailMessageType,
} from './email-message.entity';
import { EMAIL_QUEUE, type SendEmailJob } from './mail-queue.constants';

type QueueEmailParams = {
  user: User;
  type: EmailMessageType;
  subject: string;
  body: string;
  relatedEventId: string | null;
};

@Injectable()
export class MailService {
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(
    @InjectRepository(EmailMessage)
    private readonly emailMessages: Repository<EmailMessage>,
    @InjectQueue(EMAIL_QUEUE)
    private readonly emailQueue: Queue<SendEmailJob>,
    private readonly config: ConfigService,
  ) {
    this.from = this.config.get<string>('MAIL_FROM') ?? '';
    this.transporter = this.createTransporter();
  }

  async queueEmail(params: QueueEmailParams): Promise<EmailMessage> {
    const message = await this.emailMessages.save(
      this.emailMessages.create({
        userId: params.user.id,
        user: params.user,
        email: params.user.email,
        type: params.type,
        subject: params.subject,
        body: params.body,
        status: EmailMessageStatus.Pending,
        relatedEventId: params.relatedEventId,
        sentAt: null,
        failedAt: null,
        failureReason: null,
      }),
    );

    try {
      await this.emailQueue.add('send', { emailMessageId: message.id });
    } catch (error) {
      await this.markFailed(message, this.resolveErrorMessage(error));
    }

    return message;
  }

  async sendQueuedMessage(emailMessageId: string): Promise<void> {
    const message = await this.emailMessages.findOne({
      where: { id: emailMessageId },
    });
    if (!message || message.status !== EmailMessageStatus.Pending) {
      return;
    }

    if (!this.transporter || !this.from) {
      await this.markFailed(message, 'SMTP is not configured');
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: message.email,
        subject: message.subject,
        text: message.body,
      });
      message.status = EmailMessageStatus.Sent;
      message.sentAt = new Date();
      message.failedAt = null;
      message.failureReason = null;
      await this.emailMessages.save(message);
    } catch (error) {
      await this.markFailed(message, this.resolveErrorMessage(error));
    }
  }

  private createTransporter(): Transporter | null {
    const host = this.config.get<string>('MAIL_HOST');
    const port = this.config.get<number>('MAIL_PORT');
    const user = this.config.get<string>('MAIL_USER');
    const pass = this.config.get<string>('MAIL_PASSWORD');

    if (!host || !port || !user || !pass) {
      return null;
    }

    return createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  private async markFailed(
    message: EmailMessage,
    failureReason: string,
  ): Promise<void> {
    message.status = EmailMessageStatus.Failed;
    message.failedAt = new Date();
    message.failureReason = failureReason;
    await this.emailMessages.save(message);
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown email error';
  }
}
