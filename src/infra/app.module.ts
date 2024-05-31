import { ToolsModule } from '@/shared/tools/tools.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './auth/auth.module';
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
      validate: (env) => envSchema.parse(env),
    }),
    EnvModule,
    HttpModule,
    AuthModule,
    ToolsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
