import { EventManager, EventsMap } from '@/core/types/events';

export class FakeEventManager implements EventManager {
  #subscribers: Record<string, ((data: any) => void)[]> = {};

  async publish<K extends keyof EventsMap>(
    event: K,
    data: EventsMap[K],
  ): Promise<void> {
    const subscribers = this.#subscribers[event] ?? [];
    subscribers.forEach((subscriber) => subscriber(data));
  }

  subscribe<K extends keyof EventsMap>(
    event: K,
    callback: (data: EventsMap[K]) => void,
  ): void {
    this.#subscribers[event] = [...(this.#subscribers[event] ?? []), callback];
  }

  clearSubscriptions(): void {
    this.#subscribers = {};
  }
}
