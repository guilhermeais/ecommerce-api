import { BaseError } from '@/core/errors/base-error';
import { HttpStatus } from '@nestjs/common';

export class EmailAlreadyInUseError extends BaseError {
  constructor(email: string) {
    super({
      message: `O email já está em cadastrado!`,
      code: HttpStatus.CONFLICT,
      details: `O email ${email} já está em uso por outro usuário, por favor, tente outro email.`,
    });
  }
}
