import { Logger } from '@/shared/logger';
import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
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
    const s3Endpoint = envService.get('S3_ENDPOINT');
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

    const config: S3ClientConfig = {
      region: s3Region,
      endpoint: s3Endpoint,
      credentials: {
        accessKeyId: s3AccessKeyId,
        secretAccessKey: s3SecretAccessKey,
      },
    };

    console.log(
      'S3ClientFactory',
      `Initializing s3 config: ${JSON.stringify(
        {
          ...config,
          credentials: {
            accessKeyId: '***',
            secretAccessKey: '***',
          },
        },
        null,
        2,
      )}`,
    );

    const s3Client = new S3Client(config);

    return s3Client;
  },
};
