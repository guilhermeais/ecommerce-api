import { EnvService } from '@/infra/env/env.service';
import { FactoryProvider } from '@nestjs/common';
import mongoose, { Mongoose } from 'mongoose';

export const AUTH_MONGOOSE_CONNECTION_PROVIDER =
  'AUTH_MONGOOSE_CONNECTION_PROVIDER';

export const AuthMongooseConnectionFactory: FactoryProvider<Mongoose> = {
  inject: [EnvService],
  provide: AUTH_MONGOOSE_CONNECTION_PROVIDER,
  async useFactory(envService: EnvService): Promise<Mongoose> {
    const uri = envService.get('MONGO_URI');
    const appName = 'ecommerce';
    const dbName = 'auth';

    console.log(
      `⏳ Connecting to mongo using => URI: ${uri}, appName: ${appName}, dbName: ${dbName}...`,
    );

    const connection = await mongoose.connect(uri, {
      dbName,
      appName,
    });

    console.log('🔗 Connected to MongoDB');

    return connection;
  },
};
