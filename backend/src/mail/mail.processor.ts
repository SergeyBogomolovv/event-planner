import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Job } from 'bullmq';
import { EMAIL_QUEUE, type SendEmailJob } from './mail-queue.constants';
import { MailService } from './mail.service';

@Injectable()
@Processor(EMAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  constructor(private readonly mailService: MailService) {
    super();
  }

  process(job: Job<SendEmailJob>): Promise<void> {
    return this.mailService.sendQueuedMessage(job.data.emailMessageId);
  }
}
