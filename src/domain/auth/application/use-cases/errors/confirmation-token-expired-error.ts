import { BaseError } from '@/core/errors/base-error';
import { HttpStatus } from '@nestjs/common';

export class ConfirmationTokenExpiredError extends BaseError {
  constructor() {
    super({
      message: 'Token de confirmação expirado',
      code: HttpStatus.UNAUTHORIZED,
      isClientError: true,
      details:
        'O token de confirmação expirou. Por favor, solicite um novo token de confirmação.',
    });
  }
}
