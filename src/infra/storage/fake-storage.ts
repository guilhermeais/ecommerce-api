import { File } from '@/domain/product/application/gateways/storage/file';
import {
  StorageGateway,
  UploadResponse,
} from '@/domain/product/application/gateways/storage/storage-gateway';
import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FakeStorageGateway implements StorageGateway {
  #files: File[] = [];
  async upload(file: File): Promise<UploadResponse> {
    const url = faker.internet.url();
    const newFile = {
      ...file,
      url,
    };

    this.#files.push(newFile);

    return {
      url,
    };
  }
}
