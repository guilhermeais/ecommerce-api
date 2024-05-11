import { EventManager, EventsMap } from '@/core/types/events';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventEmitterEventManager implements EventManager {
  constructor(private eventEmitter: EventEmitter2) {}

  clearSubscriptions(): void {
    this.eventEmitter.removeAllListeners();
  }

  async publish<K extends keyof EventsMap>(
    event: K,
    data: EventsMap[K],
  ): Promise<void> {
    this.eventEmitter.emit(event, data);
  }

  subscribe<K extends keyof EventsMap>(
    event: K,
    callback: (data: EventsMap[K]) => void,
  ): void {
    this.eventEmitter.on(event, callback);
  }
}
