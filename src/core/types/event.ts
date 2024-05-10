export interface Event<EventsMap> {
  publish: <K extends keyof EventsMap>(event: K, data: EventsMap[K]) => void;

  subscribe: <K extends keyof EventsMap>(
    event: K,
    callback: (data: EventsMap[K]) => void,
  ) => void;

  clearSubscriptions: () => void;
}
