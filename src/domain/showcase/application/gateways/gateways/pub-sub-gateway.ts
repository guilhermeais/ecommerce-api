export abstract class PubSubGateway {
  abstract publish<T>(topic: string, data: T): Promise<void>;
}
