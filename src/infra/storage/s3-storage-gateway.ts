import { File } from '@/domain/product/application/gateways/storage/file';
import {
  StorageGateway,
  UploadResponse,
} from '@/domain/product/application/gateways/storage/storage-gateway';
import { Logger } from '@/shared/logger';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EnvService } from '../env/env.service';
import { S3_CLIENT_PROVIDER } from './s3-client.factory';

Injectable();
export class S3StorageGateway implements StorageGateway {
  constructor(
    @Inject(S3_CLIENT_PROVIDER)
    private readonly s3Client: S3Client,
    private readonly env: EnvService,
    private readonly logger: Logger,
  ) {}

  async upload(file: File): Promise<UploadResponse> {
    try {
      const bucket = this.env.get('STORAGE_BUCKET_NAME');
      this.logger.log(
        S3StorageGateway.name,
        `Uploading file ${file.name} to S3 storage on bucket ${bucket}`,
      );
      const uniqueFileName = `${randomUUID()}-${file.name}`;

      const putObjectCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: uniqueFileName,
        Body: file.body,
        ContentType: file.type,
      });

      await this.s3Client.send(putObjectCommand);
      const endpoint = this.env.get('S3_ENDPOINT');
      const url = `${endpoint}/${bucket}/${uniqueFileName}`;
      this.logger.log(
        S3StorageGateway.name,
        `File ${file.name} deployed to S3 storage on bucket ${url}`,
      );
      return {
        url,
      };
    } catch (error: any) {
      this.logger.error(
        S3StorageGateway.name,
        `Error uploading file ${file.name} to S3 storage: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  async delete(url: string): Promise<void> {
    try {
      this.logger.log(
        S3StorageGateway.name,
        `Deleting file ${url} from S3 storage`,
      );
      const bucket = this.env.get('STORAGE_BUCKET_NAME');
      const fileName = url.split('/').pop();

      const deleteObjectCommand = new DeleteObjectCommand({
        Bucket: bucket,
        Key: fileName!,
      });

      await this.s3Client.send(deleteObjectCommand);

      this.logger.log(
        S3StorageGateway.name,
        `Successfully deleted file ${url} from S3 storage`,
      );
    } catch (error: any) {
      this.logger.error(
        S3StorageGateway.name,
        `Error deleting file ${url} from S3 storage: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
