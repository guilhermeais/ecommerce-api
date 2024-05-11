import { Logger } from '../logger';
import { Injectable, Logger as NestLogger } from '@nestjs/common';

@Injectable()
export class NestJsLogger implements Logger {
  log(context: string, message: string): void {
    NestLogger.log(message, context);
  }

  error(context: string, message: string, trace: string): void {
    NestLogger.error(message, trace, context);
  }

  warn(context: string, message: string): void {
    NestLogger.warn(message, context);
  }
  debug(context: string, message: string): void {
    NestLogger.debug(message, context);
  }
}
