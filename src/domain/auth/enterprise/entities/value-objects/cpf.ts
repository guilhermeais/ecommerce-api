import { ValueObject } from '@/core/entities/value-object';
import { InvalidCPFError } from './errors/invalid-cpf-error';
import { cpf } from 'cpf-cnpj-validator';

export class CPF extends ValueObject<{ value: string }> {
  private constructor(props: { value: string }) {
    super(props);
  }

  public static create(cpf: string): CPF {
    if (!this.isValid(cpf)) {
      throw new InvalidCPFError(cpf);
    }

    return new CPF({ value: cpf });
  }

  private static isValid(value: string): boolean {
    return cpf.isValid(value);
  }

  get value(): string {
    return this.props.value;
  }
}
