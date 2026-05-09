import type { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import type { Repository } from 'typeorm';
import {
  EmailMessage,
  EmailMessageStatus,
  EmailMessageType,
} from './email-message.entity';
import type { SendEmailJob } from './mail-queue.constants';
import { MailService } from './mail.service';

const now = new Date('2026-01-01T00:00:00Z');

describe('MailService', () => {
  function createService(initialMessages: EmailMessage[] = []) {
    const messagesStore = [...initialMessages];
    const emailMessagesRepo = {
      create: jest.fn((data: Partial<EmailMessage>) => data as EmailMessage),
      save: jest.fn((message: EmailMessage) => {
        const saved = {
          ...message,
          id: message.id ?? `message-${messagesStore.length + 1}`,
          createdAt: message.createdAt ?? now,
        };
        const index = messagesStore.findIndex((item) => item.id === saved.id);
        if (index >= 0) {
          messagesStore[index] = saved;
        } else {
          messagesStore.push(saved);
        }
        return Promise.resolve(saved);
      }),
      findOne: jest.fn(({ where }: { where: Partial<EmailMessage> }) =>
        Promise.resolve(
          messagesStore.find((message) =>
            Object.entries(where).every(
              ([key, value]) => message[key as keyof EmailMessage] === value,
            ),
          ) ?? null,
        ),
      ),
    };
    const emailQueue = {
      add: jest.fn(() => Promise.resolve()),
    };
    const config = {
      get: jest.fn(() => undefined),
    };

    return {
      service: new MailService(
        emailMessagesRepo as unknown as Repository<EmailMessage>,
        emailQueue as unknown as Queue<SendEmailJob>,
        config as unknown as ConfigService,
      ),
      messagesStore,
      emailQueue,
    };
  }

  it('creates pending email message and queues send job', async () => {
    const { service, messagesStore, emailQueue } = createService();

    await service.queueEmail({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Пользователь',
      } as never,
      type: EmailMessageType.EventInvitation,
      subject: 'Приглашение',
      body: 'Текст',
      relatedEventId: 'event-1',
    });

    expect(messagesStore[0].status).toBe(EmailMessageStatus.Pending);
    expect(emailQueue.add).toHaveBeenCalledWith('send', {
      emailMessageId: messagesStore[0].id,
    });
  });

  it('marks queued message as failed when smtp is not configured', async () => {
    const message = createEmailMessage();
    const { service, messagesStore } = createService([message]);

    await service.sendQueuedMessage(message.id);

    expect(messagesStore[0].status).toBe(EmailMessageStatus.Failed);
    expect(messagesStore[0].failedAt).toBeInstanceOf(Date);
  });
});

function createEmailMessage(
  overrides: Partial<EmailMessage> = {},
): EmailMessage {
  return {
    id: 'message-1',
    userId: 'user-1',
    user: null,
    email: 'user@example.com',
    type: EmailMessageType.EventInvitation,
    subject: 'Тема',
    body: 'Текст',
    status: EmailMessageStatus.Pending,
    relatedEventId: 'event-1',
    relatedEvent: null,
    sentAt: null,
    failedAt: null,
    failureReason: null,
    createdAt: now,
    ...overrides,
  };
}
