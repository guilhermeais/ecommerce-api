import { UserEvents } from '@/domain/auth/application/gateways/events/user-events';
import { Global, Module } from '@nestjs/common';
import { EventEmitterUserEvents } from './event-emitter-user-events';

@Global()
@Module({
  providers: [
    {
      provide: UserEvents,
      useClass: EventEmitterUserEvents,
    },
  ],
  exports: [UserEvents],
})
export class EventsModule {}
