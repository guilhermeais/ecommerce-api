import { EmailSender } from '@/domain/notifications/application/gateways/notifications/email-sender';
import { StorageGateway } from '@/domain/product/application/gateways/storage/storage-gateway';
import { ProductSimilarityModelGateway } from '@/domain/showcase/application/gateways/gateways/product-similarity-model-gateway';
import { PubSubGateway } from '@/domain/showcase/application/gateways/gateways/pub-sub-gateway';
import { AppModule } from '@/infra/app.module';
import { FakeEmailSender } from '@/infra/notifications/fake-email-sender';
import { GOOGLE_PUB_SUB_FACTORY } from '@/infra/pubsub/gcp/gcp-publisher.factory';
import { FakeStorageGateway } from '@/infra/storage/fake-storage';
import { GCP_STORAGE_PROVIDER } from '@/infra/storage/gcp-storage.factory';
import { ModuleMetadata } from '@nestjs/common';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { mock } from 'vitest-mock-extended';
import { FakeProductSimilarityModel } from './showcase/application/gateways/gateways/fake-product-similarity-model';
import { TrainProductsSimilarityModelCronName } from '@/infra/crons/cron.module';
import { S3_CLIENT_PROVIDER } from '@/infra/storage/s3-client.factory';

export function makeTestingApp(
  modifications?: Partial<ModuleMetadata>,
): TestingModuleBuilder {
  return Test.createTestingModule({
    ...modifications,
    imports: [AppModule, ...(modifications?.imports ?? [])],
  })
    .overrideProvider(EmailSender)
    .useClass(FakeEmailSender)
    .overrideProvider(StorageGateway)
    .useClass(FakeStorageGateway)
    .overrideProvider(GCP_STORAGE_PROVIDER)
    .useValue(mock())
    .overrideProvider(PubSubGateway)
    .useValue(mock())
    .overrideProvider(GOOGLE_PUB_SUB_FACTORY)
    .useValue(mock())
    .overrideProvider(ProductSimilarityModelGateway)
    .useValue(new FakeProductSimilarityModel())
    .overrideProvider(TrainProductsSimilarityModelCronName)
    .useValue(mock())
    .overrideProvider(S3_CLIENT_PROVIDER)
    .useValue(mock());
}
