export interface Event<EventsMap> {
  publish: <K extends keyof EventsMap>(event: K, data: EventsMap[K]) => void;
}
