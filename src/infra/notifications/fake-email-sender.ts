import {
  EmailSender,
  EmailSenderRequest,
  EmailSenderResponse,
  SentEmail,
} from '@/domain/notifications/application/gateways/notificaitons/email-sender';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class FakeEmailSender implements EmailSender {
  #emails: Record<string, SentEmail> = {};

  async send(request: EmailSenderRequest): Promise<EmailSenderResponse> {
    const messageId = randomUUID();

    this.#emails[messageId] = {
      request,
      messageId,
      status: 'sent',
      response: 'Email sent successfully',
    };

    return {
      messageId,
      status: 'sent',
      response: 'Email sent successfully',
    };
  }

  async getSentEmails(): Promise<SentEmail[]> {
    return Object.values(this.#emails);
  }
}
