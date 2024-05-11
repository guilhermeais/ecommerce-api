import { Logger } from '@/shared/logger';
import { Injectable } from '@nestjs/common';
import { User } from '../../enterprise/entities/user';
import {
  ConfirmationTokenEvents,
  ConfirmationTokenEventsEnum,
} from '../gateways/events/confirmation-token-events';
import { UserEvents, UserEventsEnum } from '../gateways/events/user-events';
import { GenerateConfirmationTokenUseCase } from '../use-cases/generate-confirmation-token';

@Injectable()
export class OnUserCreated {
  constructor(
    private readonly userEvents: UserEvents,
    private readonly logger: Logger,
    private readonly generateConfirmationToken: GenerateConfirmationTokenUseCase,
    private readonly confirmationTokenEvents: ConfirmationTokenEvents,
  ) {
    this.logger.log(OnUserCreated.name, 'subscribing to user created event');
    this.userEvents.subscribe(UserEventsEnum.USER_CREATED, (...args) =>
      this.handle(...args),
    );

    this.logger.log(
      OnUserCreated.name,
      `Subscribed to ${UserEventsEnum.USER_CREATED} event.`,
    );
  }

  async handle(user: User): Promise<void> {
    try {
      this.logger.log(
        OnUserCreated.name,
        `Generated confirmation token for user [${user.id.toString()}] ${user.email.value}`,
      );

      const confirmationToken = await this.generateConfirmationToken.execute({
        userId: user.id.toString(),
      });

      this.logger.log(
        OnUserCreated.name,
        `Confirmation token ${confirmationToken.id.toString()} generated for user [${user.id.toString()}] ${user.email.value}`,
      );

      await this.confirmationTokenEvents.publish(
        ConfirmationTokenEventsEnum.CONFIRMATION_TOKEN_CREATED,
        confirmationToken,
      );

      this.logger.log(
        OnUserCreated.name,
        `Confirmation token ${confirmationToken.id.toString()} published for user [${user.id.toString()}] ${user.email.value}`,
      );
    } catch (error: any) {
      this.logger.error(
        OnUserCreated.name,
        `Error generating confirmation token for user [${user.id.toString()}] ${user.email.value}: ${error.message}`,
        error.stack,
      );
    }
  }
}
