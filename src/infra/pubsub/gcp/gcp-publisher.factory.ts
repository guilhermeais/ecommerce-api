import { EnvService } from '@/infra/env/env.service';
import { Logger } from '@/shared/logger';
import { PubSub } from '@google-cloud/pubsub';
import { Provider } from '@nestjs/common';
import { JWTInput } from 'google-auth-library';

export const GOOGLE_PUB_SUB_FACTORY = Symbol('GOOGLE_PUB_SUB_FACTORY');

export const GOOGLE_PUB_SUB_PROVIDER: Provider<PubSub> = {
  provide: GOOGLE_PUB_SUB_FACTORY,
  inject: [EnvService, Logger],
  useFactory: (env: EnvService, logger: Logger) => {
    const credentials: JWTInput = JSON.parse(
      Buffer.from(
        env.get('GOOGLE_APPLICATION_CREDENTIALS'),
        'base64',
      ).toString(),
    );
    logger.log(
      'GcpStorageFactory',
      `Creating Google Cloud Storage client, project_id: ${credentials.project_id}...`,
    );

    return new PubSub({
      credentials,
      projectId: credentials.project_id,
    });
  },
};
