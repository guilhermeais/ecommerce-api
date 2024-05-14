import { EventManager, Events } from '@/core/types/events';
import { ConfirmationToken } from '@/domain/auth/enterprise/entities/confirmation-token';
import { Logger } from '@/shared/logger';
import { Injectable } from '@nestjs/common';
import { EmailSender } from '../gateways/notificaitons/email-sender';

@Injectable()
export class OnConfirmationTokenCreated {
  constructor(
    private readonly emailSender: EmailSender,
    private readonly logger: Logger,
    private readonly events: EventManager,
  ) {
    this.logger.log(
      OnConfirmationTokenCreated.name,
      'subscribing to confirmation token created event',
    );
    this.events.subscribe(Events.CONFIRMATION_TOKEN_CREATED, (...args) =>
      this.handle(...args),
    );

    this.logger.log(
      OnConfirmationTokenCreated.name,
      `Subscribed to CONFIRMATION_TOKEN_CREATED event.`,
    );
  }

  async handle(confirmationToken: ConfirmationToken): Promise<void> {
    try {
      this.logger.log(
        OnConfirmationTokenCreated.name,
        `Sending confirmation email to ${confirmationToken.email} with token ${confirmationToken.id} - ${confirmationToken.token}`,
      );

      const [firstName] = confirmationToken.userName.split(' ');

      const emailResult = await this.emailSender.send({
        to: confirmationToken.email.value,
        subject: `Confirmação de Cadastro`,
        template: 'account-confirmation',
        contentObject: {
          token: confirmationToken.token,
          userName: firstName,
        },
      });

      this.logger.log(
        OnConfirmationTokenCreated.name,
        `Confirmation ${confirmationToken.id} email sent to ${confirmationToken.email}: ${JSON.stringify(emailResult, null, 2)}`,
      );
    } catch (error: any) {
      this.logger.error(
        OnConfirmationTokenCreated.name,
        `Error sending confirmation email to ${confirmationToken.email}: ${error.message}`,
        error.stack,
      );
    }
  }
}
