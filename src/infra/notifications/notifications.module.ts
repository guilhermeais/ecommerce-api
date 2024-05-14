import { EmailSender } from '@/domain/notifications/application/gateways/notificaitons/email-sender';
import { Module } from '@nestjs/common';
import { FakeEmailSender } from './fake-email-sender';

@Module({
  providers: [
    {
      provide: EmailSender,
      useClass: FakeEmailSender,
    },
  ],
  exports: [EmailSender],
})
export class NotificationsModule {}
