import {
  UserEvents,
  UserEventsMap,
} from '@/domain/auth/application/gateways/events/user-events';

export class FakeUserEvents implements UserEvents {
  #subscribers: Record<string, ((data: any) => void)[]> = {};

  subscribe<K extends 'user.created'>(
    event: K,
    callback: (data: UserEventsMap[K]) => void,
  ): void {
    if (!this.#subscribers[event]) {
      this.#subscribers[event] = [];
    }

    this.#subscribers[event].push(callback);
  }

  async publish<K extends 'user.created'>(
    event: K,
    data: UserEventsMap[K],
  ): Promise<void> {
    if (!this.#subscribers[event]) {
      return;
    }

    this.#subscribers[event].forEach((subscriber) => subscriber(data));
  }
}
