import { HttpStatus } from '@nestjs/common';

export type BaseErrorArgs = {
  message: string;
  code?: HttpStatus;
  details?: string;
  isClientError?: boolean;
};

export class BaseError extends Error {
  public readonly code: HttpStatus;
  public readonly details: string;
  public readonly timestamp: Date;
  public readonly isClientError: boolean;

  constructor({
    message,
    code = HttpStatus.INTERNAL_SERVER_ERROR,
    details,
    isClientError = true,
  }: BaseErrorArgs) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details ?? '';
    this.timestamp = new Date();
    this.isClientError = isClientError;

    Error.captureStackTrace(this, this.constructor);
  }
}
