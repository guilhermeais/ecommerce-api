import { EmailTemplate, EmailTemplatesMap } from './email-templates';

export type EmailSenderRequest<T extends EmailTemplate> = {
  to: string;
  subject: string;
  template: T;
  contentObject: EmailTemplatesMap[T];
};
export type SentEmail<K extends EmailTemplate = any> = {
  request: EmailSenderRequest<K>;
  messageId: string;
  status: 'sent' | 'failed';
  response: string;
};

export type EmailSenderResponse = {
  messageId: string;
  status: 'sent' | 'failed';
  response: string;
};

export abstract class EmailSender {
  abstract send<T extends EmailTemplate>(
    request: EmailSenderRequest<T>,
  ): Promise<EmailSenderResponse>;
  abstract getSentEmails(): Promise<SentEmail[]>;
}
