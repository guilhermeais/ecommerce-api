import { UseCase } from '@/core/types/use-case';
import { Logger } from '@/shared/logger';
import { EmailSender } from '../gateways/notificaitons/email-sender';

export type SendEmailNotificationRequest = {
  to: string;
  subject: string;
  template: string;
  contentObject: Record<string, string | number>;
};

export type SendEmailNotificationResponse = void;

export class SendEmailNotificationUseCase
  implements
    UseCase<SendEmailNotificationRequest, SendEmailNotificationResponse>
{
  constructor(
    private readonly emailSender: EmailSender,
    private readonly logger: Logger,
  ) {}

  async execute(request: SendEmailNotificationRequest): Promise<void> {
    this.logger.log(
      SendEmailNotificationUseCase.name,
      `Sending email to ${request.to} with subject ${request.subject}: ${JSON.stringify(request, null, 2)}`,
    );

    const { messageId: id } = await this.emailSender.send({
      to: request.to,
      subject: request.subject,
      template: request.template,
      contentObject: request.contentObject,
    });

    this.logger.log(
      SendEmailNotificationUseCase.name,
      `Email ${id} sent to ${request.to} with subject ${request.subject}`,
    );
  }
}
