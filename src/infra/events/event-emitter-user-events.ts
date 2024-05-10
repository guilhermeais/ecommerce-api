import {
  UserEvents,
  UserEventsMap,
} from '@/domain/auth/application/gateways/events/user-events';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventEmitterUserEvents implements UserEvents {
  constructor(private eventEmitter: EventEmitter2) {}

  clearSubscriptions(): void {
    this.eventEmitter.removeAllListeners();
  }

  async publish<K extends keyof UserEventsMap>(
    event: K,
    data: UserEventsMap[K],
  ): Promise<void> {
    this.eventEmitter.emit(event, data);
  }

  subscribe<K extends keyof UserEventsMap>(
    event: K,
    callback: (data: UserEventsMap[K]) => void,
  ): void {
    this.eventEmitter.on(event, callback);
  }
}
