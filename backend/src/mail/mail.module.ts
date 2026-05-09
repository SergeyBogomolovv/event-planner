import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailMessage } from './email-message.entity';
import { EMAIL_QUEUE } from './mail-queue.constants';
import { MailProcessor } from './mail.processor';
import { MailService } from './mail.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailMessage]),
    BullModule.registerQueue({ name: EMAIL_QUEUE }),
  ],
  providers: [MailService, MailProcessor],
  exports: [MailService],
})
export class MailModule {}
