import { EventManager, Events } from '@/core/types/events';
import { SignUpInvite } from '@/domain/auth/enterprise/entities/signup-invite';
import { EnvService } from '@/infra/env/env.service';
import { Logger } from '@/shared/logger';
import { Injectable } from '@nestjs/common';
import { EmailSender } from '../gateways/notifications/email-sender';
import { EmailTemplate } from '../gateways/notifications/email-templates';

@Injectable()
export class OnSignUpInviteCreated {
  constructor(
    private readonly emailSender: EmailSender,
    private readonly logger: Logger,
    private readonly events: EventManager,
    private readonly env: EnvService,
  ) {
    this.logger.log(
      OnSignUpInviteCreated.name,
      'subscribing to sign up invite created event',
    );

    this.events.subscribe(Events.SIGN_UP_INVITE_CREATED, (...args) =>
      this.handle(...args),
    );

    this.logger.log(OnSignUpInviteCreated.name, `Subscribed!`);
  }

  async handle(signUpInvite: SignUpInvite) {
    const appName = this.env.get('APP_NAME');
    const sentByName = signUpInvite.sentBy.name;
    const { guestName, guestEmail } = signUpInvite;

    try {
      this.logger.log(
        OnSignUpInviteCreated.name,
        `Sending sign up invite email to ${guestEmail.value} with id ${signUpInvite.id}`,
      );

      const emailResult = await this.emailSender.send({
        to: guestEmail.value,
        subject: `Convite para ${guestName} para se juntar ao ${appName} 🚀`,
        template: EmailTemplate.SignUpInvite,
        contentObject: {
          inviteId: signUpInvite.id.toString(),
          sentByName,
          guestName,
        },
      });

      this.logger.log(
        OnSignUpInviteCreated.name,
        `Sign up invite ${signUpInvite.id.toString()} email sent to ${guestEmail.value}: ${JSON.stringify(emailResult, null, 2)}`,
      );
    } catch (error: any) {
      this.logger.error(
        OnSignUpInviteCreated.name,
        `Error sending sign up invite email to ${guestEmail.value} with id ${signUpInvite.id}: ${error.message}`,
      );
    }
  }
}
