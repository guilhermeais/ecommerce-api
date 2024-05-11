import { Logger } from '../logger';
import { Injectable, Logger as NestLogger } from '@nestjs/common';

@Injectable()
export class NestJsLogger implements Logger {
  #logger = new NestLogger();
  log(context: string, message: string): void {
    this.#logger.log(message, context);
  }

  error(context: string, message: string, trace: string): void {
    this.#logger.error(message, trace, context);
  }

  warn(context: string, message: string): void {
    this.#logger.warn(message, context);
  }
  debug(context: string, message: string): void {
    this.#logger.debug(message, context);
  }
}
