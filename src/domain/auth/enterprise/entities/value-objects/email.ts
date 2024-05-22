import { ValueObject } from 'src/core/entities/value-object';
import { InvalidEmailFormatError } from './errors/invalid-email-format-error';

export class Email extends ValueObject<{ value: string }> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: { value: string }) {
    super(props);
  }

  public static create(email: string): Email {
    if (!Email.isValid(email)) {
      throw new InvalidEmailFormatError(email);
    }

    return new Email({ value: email });
  }

  public static restore(email: string): Email {
    return new Email({ value: email });
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
