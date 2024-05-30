import { EnvService } from '@/infra/env/env.service';
import { FactoryProvider } from '@nestjs/common';
import mongoose, { Mongoose } from 'mongoose';

export const MONGOOSE_CONNECTION_PROVIDER = 'MONGOOSE_CONNECTION_PROVIDER';

export const MongooseConnectionFactory: FactoryProvider<Mongoose> = {
  inject: [EnvService],
  provide: MONGOOSE_CONNECTION_PROVIDER,
  async useFactory(envService: EnvService): Promise<Mongoose> {
    const uri = envService.get('MONGO_URI');
    const appName = 'ecommerce';
    const dbName = 'ecommerce';

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
