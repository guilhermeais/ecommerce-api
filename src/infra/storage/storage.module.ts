import { StorageGateway } from '@/domain/product/application/gateways/storage/storage-gateway';
import { Module } from '@nestjs/common';
import { FakeStorageGateway } from './fake-storage';

@Module({
  providers: [
    {
      provide: StorageGateway,
      useClass: FakeStorageGateway,
    },
  ],
  exports: [StorageGateway],
})
export class StorageModule {}
