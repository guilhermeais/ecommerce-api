import { HttpStatus } from '@nestjs/common';
import { BaseError } from 'src/core/errors/base-error';

export class InvalidEmailFormatError extends BaseError {
  constructor(email: string) {
    super({
      message: 'Email inválido!',
      code: HttpStatus.BAD_REQUEST,
      details: `O email "${email}" não está em um formato válido. (Ex: fulano@mail.com)`,
    });
  }
}
