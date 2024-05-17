import { ConsoleLogger, Injectable } from '@nestjs/common';
import { Logger } from '../logger';

@Injectable()
export class NestJsLogger implements Logger {
  #logger = new ConsoleLogger();
  log(context: string, message: string): void {
    this.#logger.log(context, message);
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
