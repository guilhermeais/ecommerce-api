import { ValueObject } from '@/core/entities/value-object';
import { InvalidPasswordError } from './errors/invalid-password-error';

export class Password extends ValueObject<{ value: string }> {
  private constructor(props: { value: string }) {
    super(props);
  }

  public static create(password: string): Password {
    if (!this.isValid(password)) {
      throw new InvalidPasswordError(password);
    }

    return new Password({ value: password });
  }

  private static isValid(password: string): boolean {
    return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/.test(password);
  }

  get value(): string {
    return this.props.value;
  }
}
