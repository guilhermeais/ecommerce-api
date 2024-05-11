export abstract class Event<EventsMap> {
  abstract publish: <K extends keyof EventsMap>(
    event: K,
    data: EventsMap[K],
  ) => Promise<void>;

  abstract subscribe: <K extends keyof EventsMap>(
    event: K,
    callback: (data: EventsMap[K]) => void,
  ) => void;

  abstract clearSubscriptions: () => void;
}
