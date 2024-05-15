import {
  EmailSender,
  EmailSenderRequest,
  EmailSenderResponse,
  SentEmail,
} from '@/domain/notifications/application/gateways/notifications/email-sender';
import { EmailTemplate } from '@/domain/notifications/application/gateways/notifications/email-templates';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class FakeEmailSender implements EmailSender {
  async send<T extends EmailTemplate>(
    request: EmailSenderRequest<T>,
  ): Promise<EmailSenderResponse> {
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
  #emails: Record<string, SentEmail> = {};

  async getSentEmails(): Promise<SentEmail[]> {
    return Object.values(this.#emails);
  }
}
