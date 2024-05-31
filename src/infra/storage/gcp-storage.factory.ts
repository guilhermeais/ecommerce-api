import { Logger } from '@/shared/logger';
import { Storage } from '@google-cloud/storage';
import { FactoryProvider, Scope } from '@nestjs/common';
import { JWTInput } from 'google-auth-library';
import { EnvService } from '../env/env.service';

export const GCP_STORAGE_PROVIDER = Symbol('GCP_STORAGE_PROVIDER');

export const GcpStorageFactory: FactoryProvider<Storage> = {
  scope: Scope.TRANSIENT,
  inject: [EnvService, Logger],
  provide: GCP_STORAGE_PROVIDER,
  useFactory(envService: EnvService, logger: Logger): Storage {
    const credentials: JWTInput = JSON.parse(
      Buffer.from(
        envService.get('GOOGLE_APPLICATION_CREDENTIALS'),
        'base64',
      ).toString(),
    );
    logger.log(
      'GcpStorageFactory',
      `Creating Google Cloud Storage client, project_id: ${credentials.project_id}...`,
    );
    const storage = new Storage({
      projectId: credentials.project_id,
      credentials,
    });

    logger.log('GcpStorageFactory', `Google Cloud Storage client created!`);

    return storage;
  },
};
