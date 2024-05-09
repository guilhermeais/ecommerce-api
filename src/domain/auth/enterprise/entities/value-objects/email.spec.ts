import { Email } from './email';
import { InvalidEmailFormatError } from './errors/invalid-email-format-error';

describe('Email', () => {
  it.each(['', 'a', 'gui.com', 1, null, undefined, {}, () => {}] as any[])(
    'should throw InvalidEmailFormatError when Email.create(%s)',
    (email) => {
      expect(() => Email.create(email)).toThrow(
        new InvalidEmailFormatError(email),
      );
    },
  );

  it.each(['gui@gmail.com', 'test@mail.com.br'] as string[])(
    'should create an Email instance when Email.create("%s")',
    (email) => {
      const emailInstance = Email.create(email);

      expect(emailInstance).toBeInstanceOf(Email);
      expect(emailInstance.value).toBe(email);
    },
  );

  it.each([
    {
      email: 'gui@gmail.com',
      comparedEmail: 'gui@gmail.com',
      isEqual: true,
    },
    {
      email: 'gui@gmail.com',
      comparedEmail: 'gui2@gmail.com',
      isEqual: false,
    },
  ] as {
    email: string;
    comparedEmail: string;
    isEqual: boolean;
  }[])(
    'should return $isEqual when comparing $email with $comparedEmail',
    ({ email, comparedEmail, isEqual }) => {
      const emailInstance = Email.create(email);
      const comparedEmailInstance = Email.create(comparedEmail);

      expect(emailInstance.equals(comparedEmailInstance)).toBe(isEqual);
    },
  );
});
