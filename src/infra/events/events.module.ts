import { EventManager } from '@/core/types/events';
import { OnUserCreated } from '@/domain/auth/application/subscribers/on-user-created';
import { GenerateConfirmationTokenUseCase } from '@/domain/auth/application/use-cases/generate-confirmation-token';
import { OnConfirmationTokenCreated } from '@/domain/notifications/application/subscribers/on-confirmation-token-created';
import { OnSignUpInviteCreated } from '@/domain/notifications/application/subscribers/on-sign-up-invite-created';
import { OnCheckout } from '@/domain/showcase/application/subscribers/on-checkout';
import { Module } from '@nestjs/common';
import { CryptographyModule } from '../cryptography/cryptography.module';
import { DatabaseModule } from '../database/database.module';
import { EnvModule } from '../env/env.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PubSubModule } from '../pubsub/pub-sub.module';
import { EventEmitterEventManager } from './event-emitter-event-manager';

@Module({
  imports: [
    DatabaseModule,
    CryptographyModule,
    NotificationsModule,
    EnvModule,
    PubSubModule,
  ],
  providers: [
    {
      provide: EventManager,
      useClass: EventEmitterEventManager,
    },
    GenerateConfirmationTokenUseCase,
    OnUserCreated,
    OnConfirmationTokenCreated,
    OnSignUpInviteCreated,

    OnCheckout,
  ],
  exports: [EventManager],
})
export class EventsModule {}
