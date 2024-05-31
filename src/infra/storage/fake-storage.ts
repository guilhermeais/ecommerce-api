import { File } from '@/domain/product/application/gateways/storage/file';
import {
  StorageGateway,
  UploadResponse,
} from '@/domain/product/application/gateways/storage/storage-gateway';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FakeStorageGateway implements StorageGateway {
  #files: (File & { url: string })[] = [];
  async upload(file: File): Promise<UploadResponse> {
    const url = `${file.name}.${file.type}`;
    const newFile = {
      ...file,
      url,
    };

    this.#files.push(newFile);

    return {
      url,
    };
  }

  async delete(url: string): Promise<void> {
    this.#files = this.#files.filter((file) => file.url !== url);
  }
}
