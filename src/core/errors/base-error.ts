import { HttpStatus } from '@nestjs/common';

export type BaseErrorArgs = {
  message: string;
  code?: HttpStatus;
  details?: string;
};

export class BaseError extends Error {
  public readonly code: HttpStatus;
  public readonly details: string;
  public readonly timestamp: Date;

  constructor({
    message,
    code = HttpStatus.INTERNAL_SERVER_ERROR,
    details,
  }: BaseErrorArgs) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details ?? '';
    this.timestamp = new Date();

    Error.captureStackTrace(this, this.constructor);
  }
}
