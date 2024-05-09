import { HttpStatus } from '@nestjs/common';
import { BaseError } from 'src/core/errors/base-error';

export class InvalidEmailFormatError extends BaseError {
  public readonly invalidEmail: string;
  constructor(email: string) {
    super({
      message: 'Email inválido!',
      code: HttpStatus.BAD_REQUEST,
      details: `O email "${email}" não está em um formato válido. (Ex: fulano@mail.com)`,
    });

    this.invalidEmail = email;
  }
}
