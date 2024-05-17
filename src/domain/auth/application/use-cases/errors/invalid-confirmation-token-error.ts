import { BaseError } from '@/core/errors/base-error';
import { HttpStatus } from '@nestjs/common';

export class InvalidConfirmationTokenError extends BaseError {
  constructor() {
    super({
      message: 'Token de confirmação inválido',
      code: HttpStatus.BAD_REQUEST,
      isClientError: true,
      details: 'O token de confirmação é inválido.',
    });
  }
}
