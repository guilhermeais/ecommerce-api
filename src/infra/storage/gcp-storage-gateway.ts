import { File } from '@/domain/product/application/gateways/storage/file';
import {
  StorageGateway,
  UploadResponse,
} from '@/domain/product/application/gateways/storage/storage-gateway';
import { Storage } from '@google-cloud/storage';
import { EnvService } from '../env/env.service';
import { Inject, Injectable } from '@nestjs/common';
import { GCP_STORAGE_PROVIDER } from './gcp-storage.factory';
import { Logger } from '@/shared/logger';
import { randomUUID } from 'crypto';

Injectable();
export class GcpStorageGateway implements StorageGateway {
  constructor(
    @Inject(GCP_STORAGE_PROVIDER)
    private readonly storage: Storage,
    private readonly env: EnvService,
    private readonly logger: Logger,
  ) {}

  async upload(file: File): Promise<UploadResponse> {
    try {
      this.logger.log(
        GcpStorageGateway.name,
        `Uploading file ${file.name} to Google Cloud Storage`,
      );
      const bucket = this.storage.bucket(this.env.get('GOOGLE_STORAGE_BUCKET'));
      const uniqueFileName = `${randomUUID()}-${file.name}`;
      const blob = bucket.file(uniqueFileName);
      await blob.save(file.body, {
        contentType: file.type,
        metadata: {
          contentType: file.type,
        },
      });

      const url = blob.publicUrl();

      this.logger.log(
        GcpStorageGateway.name,
        `File ${file.name} uploaded to Google Cloud Storage: ${url}`,
      );

      return {
        url,
      };
    } catch (error: any) {
      this.logger.error(
        GcpStorageGateway.name,
        `Error uploading file ${file.name} to Google Cloud Storage: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  async delete(url: string): Promise<void> {
    try {
      this.logger.log(
        GcpStorageGateway.name,
        `Deleting file ${url} from Google Cloud Storage`,
      );
      const bucket = this.storage.bucket(this.env.get('GOOGLE_STORAGE_BUCKET'));
      const fileName = url.split('/').pop();
      const blob = bucket.file(fileName!);
      await blob.delete();

      this.logger.log(
        GcpStorageGateway.name,
        `File ${url} deleted from Google Cloud Storage`,
      );
    } catch (error: any) {
      this.logger.error(
        GcpStorageGateway.name,
        `Error deleting file ${url} from Google Cloud Storage: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
