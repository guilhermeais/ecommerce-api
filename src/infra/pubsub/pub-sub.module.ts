import { PubSubGateway } from '@/domain/showcase/application/gateways/gateways/pub-sub-gateway';
import { Module } from '@nestjs/common';
import { GooglePubSubGateway } from './gcp/gcp-pub-sub';
import { GOOGLE_PUB_SUB_PROVIDER } from './gcp/gcp-publisher.factory';

@Module({
  providers: [
    {
      provide: PubSubGateway,
      useClass: GooglePubSubGateway,
    },
    GOOGLE_PUB_SUB_PROVIDER,
  ],
  exports: [PubSubGateway],
})
export class PubSubModule {}
