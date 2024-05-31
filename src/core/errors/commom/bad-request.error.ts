import { HttpStatus } from '@nestjs/common';
import { BaseError } from '../base-error';

export class BadRequestError extends BaseError {
  constructor(message: string, details?: string) {
    super({
      message,
      code: HttpStatus.BAD_REQUEST,
      details,
      isClientError: true,
    });
  }
}
