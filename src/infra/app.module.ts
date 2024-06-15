import { ToolsModule } from '@/shared/tools/tools.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './auth/auth.module';
import { CronModule } from './crons/cron.module';
import { envSchema } from './env/env';
import { EnvModule } from './env/env.module';
import { EventsModule } from './events/events.module';
import { HttpModule } from './http/http.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      global: true,
    }),
    EventsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => {
        console.log('ENVS: ', env);
        return envSchema.parse(env);
      },
    }),
    EnvModule,
    HttpModule,
    AuthModule,
    ToolsModule,
    CronModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
