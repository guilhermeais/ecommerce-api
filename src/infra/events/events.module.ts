import { EventManager } from '@/core/types/events';
import { OnUserCreated } from '@/domain/auth/application/subscribers/on-user-created';
import { GenerateConfirmationTokenUseCase } from '@/domain/auth/application/use-cases/generate-confirmation-token';
import { OnConfirmationTokenCreated } from '@/domain/notifications/application/subscribers/on-confirmation-token-created';
import { Module } from '@nestjs/common';
import { CryptographyModule } from '../cryptography/cryptography.module';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventEmitterEventManager } from './event-emitter-event-manager';
import { EnvModule } from '../env/env.module';

@Module({
  imports: [DatabaseModule, CryptographyModule, NotificationsModule, EnvModule],
  providers: [
    {
      provide: EventManager,
      useClass: EventEmitterEventManager,
    },
    GenerateConfirmationTokenUseCase,
    OnUserCreated,
    OnConfirmationTokenCreated,
  ],
  exports: [EventManager],
})
export class EventsModule {}
