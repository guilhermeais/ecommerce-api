import { EmailSender } from '@/domain/notifications/application/gateways/notifications/email-sender';
import { Module } from '@nestjs/common';
import { NodeMailerEmailSender } from './nodemailer/nodemailer-email-sender';
import { TransporterFactory } from './nodemailer/transporter-factory';
import { EnvModule } from '../env/env.module';

@Module({
  imports: [EnvModule],
  providers: [
    {
      provide: EmailSender,
      useClass: NodeMailerEmailSender,
    },
    TransporterFactory,
  ],
  exports: [EmailSender],
})
export class NotificationsModule {}
