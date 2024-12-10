import { StorageGateway } from '@/domain/product/application/gateways/storage/storage-gateway';
import { Module } from '@nestjs/common';
import { S3ClientFactory } from './s3-client.factory';
import { S3StorageGateway } from './s3-storage-gateway';

@Module({
  providers: [
    {
      provide: StorageGateway,
      useClass: S3StorageGateway,
    },
    S3ClientFactory,
  ],
  exports: [StorageGateway],
})
export class StorageModule {}
