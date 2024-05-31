import { StorageGateway } from '@/domain/product/application/gateways/storage/storage-gateway';
import { Module } from '@nestjs/common';
import { GcpStorageGateway } from './gcp-storage-gateway';
import { GcpStorageFactory } from './gcp-storage.factory';

@Module({
  providers: [
    {
      provide: StorageGateway,
      useClass: GcpStorageGateway,
    },
    GcpStorageFactory,
  ],
  exports: [StorageGateway],
})
export class StorageModule {}
