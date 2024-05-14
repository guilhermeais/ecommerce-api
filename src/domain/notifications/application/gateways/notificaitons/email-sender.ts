export type EmailSenderRequest = {
  /**
   * Default is the email from the env EMAIL_FROM
   */
  from?: string;
  to: string;
  subject: string;
  template: string;
  contentObject: Record<string, string | number>;
};

export type EmailSenderResponse = {
  messageId: string;
  status: 'sent' | 'failed';
  response: string;
};

export type SentEmail = {
  request: EmailSenderRequest;
  messageId: string;
  status: 'sent' | 'failed';
  response: string;
};

export abstract class EmailSender {
  abstract send(request: EmailSenderRequest): Promise<EmailSenderResponse>;
  abstract getSentEmails(): Promise<SentEmail[]>;
}
