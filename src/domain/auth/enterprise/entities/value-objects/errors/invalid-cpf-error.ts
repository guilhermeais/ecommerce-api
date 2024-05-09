import { BaseError } from '@/core/errors/base-error';

export class InvalidCPFError extends BaseError {
  public readonly invalidCPF: string;
  constructor(cpf: string) {
    super({
      message: 'CPF inválido!',
      code: 400,
      details: `O CPF "${cpf}" não está em um formato válido. (Ex: 123.456.789-09)`,
    });

    this.invalidCPF = cpf;
  }
}
