import { BaseError } from '@/core/errors/base-error';

export class InvalidPasswordError extends BaseError {
  public readonly invalidPassword: string;
  constructor(password: string) {
    super({
      message: 'Senha inválida!',
      code: 400,
      details: `A senha não está em um formato válido, deve conter ao menos 8 caracteres, uma letra maiúscula, uma letra minúscula e um número.`,
    });

    this.invalidPassword = password;
  }
}
