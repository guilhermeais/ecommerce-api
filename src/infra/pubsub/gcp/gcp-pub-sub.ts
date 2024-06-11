import { PubSubGateway } from '@/domain/showcase/application/gateways/gateways/pub-sub-gateway';
import { Logger } from '@/shared/logger';
import { PubSub } from '@google-cloud/pubsub';
import { Inject, Injectable } from '@nestjs/common';
import { GOOGLE_PUB_SUB_FACTORY } from './gcp-publisher.factory';

@Injectable()
export class GooglePubSubGateway implements PubSubGateway {
  constructor(
    @Inject(GOOGLE_PUB_SUB_FACTORY)
    private readonly pubSub: PubSub,
    private readonly logger: Logger,
  ) {}

  async publish<T>(topicName: string, data: T): Promise<void> {
    try {
      this.logger.log(
        GooglePubSubGateway.name,
        `Publishing message to topic ${topicName}: ${JSON.stringify(data)}`,
      );

      const dataBuffer = Buffer.from(JSON.stringify(data));
      const topic = this.pubSub.topic(topicName);

      await topic.publishMessage({
        data: dataBuffer,
      });

      this.logger.log(
        GooglePubSubGateway.name,
        `Message published to topic ${topicName}`,
      );
    } catch (error: any) {
      this.logger.error(
        GooglePubSubGateway.name,
        `Error publishing message to topic ${topicName}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
