import { Global, Module } from '@nestjs/common';
import { Logger } from '../logger';
import { NestJsLogger } from './nestjs.logger';

@Global()
@Module({
  providers: [
    {
      provide: Logger,
      useClass: NestJsLogger,
    },
  ],
  exports: [Logger],
})
export class ToolsModule {}
