import { EventManager } from '@/core/types/events';
import { OnUserCreated } from '@/domain/auth/application/subscribers/on-user-created';
import { GenerateConfirmationTokenUseCase } from '@/domain/auth/application/use-cases/generate-confirmation-token';
import { Module } from '@nestjs/common';
import { CryptographyModule } from '../cryptography/cryptography.module';
import { DatabaseModule } from '../database/database.module';
import { EventEmitterEventManager } from './event-emitter-user-events';

@Module({
  imports: [DatabaseModule, CryptographyModule],
  providers: [
    {
      provide: EventManager,
      useClass: EventEmitterEventManager,
    },
    GenerateConfirmationTokenUseCase,
    OnUserCreated,
  ],
  exports: [EventManager],
})
export class EventsModule {}
