import { BaseError } from '@/core/errors/base-error';
import { HttpStatus } from '@nestjs/common';

export class InvalidLoginRequestError extends BaseError {
  constructor() {
    super({
      message: 'Email ou senha inválidos',
      code: HttpStatus.BAD_REQUEST,
      details: 'O email ou senha informados estão incorretos',
      isClientError: true,
    });
  }
}
