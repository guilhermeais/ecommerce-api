import { EventManager, Events } from '@/core/types/events';
import { ConfirmationToken } from '@/domain/auth/enterprise/entities/confirmation-token';
import { EnvService } from '@/infra/env/env.service';
import { Logger } from '@/shared/logger';
import { Injectable } from '@nestjs/common';
import { EmailSender } from '../gateways/notifications/email-sender';
import { EmailTemplate } from '../gateways/notifications/email-templates';

@Injectable()
export class OnConfirmationTokenCreated {
  constructor(
    private readonly emailSender: EmailSender,
    private readonly logger: Logger,
    private readonly events: EventManager,
    private readonly envService: EnvService,
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
        template: EmailTemplate.AccountConfirmation,
        contentObject: {
          confirmationUrl: `${this.envService.get('APP_CONFIRMATION_URL')}/${confirmationToken.token}`,
          name: firstName,
          token: confirmationToken.token,
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
