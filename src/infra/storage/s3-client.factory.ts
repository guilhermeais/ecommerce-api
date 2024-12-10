import { Logger } from '@/shared/logger';
import { S3Client } from '@aws-sdk/client-s3';
import { FactoryProvider, Scope } from '@nestjs/common';
import { EnvService } from '../env/env.service';

export const S3_CLIENT_PROVIDER = Symbol('S3_CLIENT_PROVIDER');

export const S3ClientFactory: FactoryProvider<S3Client | null> = {
  scope: Scope.DEFAULT,
  inject: [EnvService, Logger],
  provide: S3_CLIENT_PROVIDER,
  useFactory(envService: EnvService, logger: Logger): S3Client | null {
    const s3Region = envService.get('S3_REGION');
    const s3AccessKeyId = envService.get('S3_ACCESS_KEY_ID');
    const s3SecretAccessKey = envService.get('S3_SECRET_ACCESS_KEY');
    if (!s3Region) {
      logger.warn(
        'S3ClientFactory',
        'missing S3_REGION, could not crete the S3 Client',
      );
      throw new Error('missing S3_REGION, could not crete the S3 Client');
    }

    if (!s3AccessKeyId) {
      logger.warn(
        'S3ClientFactory',
        'missing S3_ACCESS_KEY_ID, could not crete the S3 Client',
      );
      throw new Error(
        'missing S3_ACCESS_KEY_ID, could not crete the S3 Client',
      );
    }

    if (!s3SecretAccessKey) {
      logger.warn(
        'S3ClientFactory',
        'missing S3_SECRET_ACCESS_KEY, could not crete the S3 Client',
      );
      throw new Error(
        'missing S3_SECRET_ACCESS_KEY, could not crete the S3 Client',
      );
    }

    const s3Client = new S3Client({
      region: s3Region,
      credentials: {
        accessKeyId: s3AccessKeyId,
        secretAccessKey: s3SecretAccessKey,
      },
    });

    return s3Client;
  },
};
