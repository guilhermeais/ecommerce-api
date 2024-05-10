import { Module } from '@nestjs/common';
import { EventEmitterUserEvents } from './event-emitter-user-events';

@Module({
  providers: [EventEmitterUserEvents],
  exports: [EventEmitterUserEvents],
})
export class EventsModule {}
