import { InvalidPasswordError } from './errors/invalid-password-error';
import { Password } from './password';

describe('Password', () => {
  it.each([
    '',
    'a',
    '12345678',
    'ABCDEFGH',
    'abcdefgh',
    '12345678a',
    'ABCDEFGHa',
    'abcdefgh1',
  ] as any[])(
    'should throw InvalidPasswordError when Password.create(%s)',
    (password) => {
      expect(() => Password.create(password)).toThrow(
        new InvalidPasswordError(password),
      );
    },
  );

  it.each(['Abcdefgh1', 'Abcdefgh1A', 'Abcdefgh1Aa'] as string[])(
    'should create a Password instance when Password.create("%s")',
    (password) => {
      const passwordInstance = Password.create(password);

      expect(passwordInstance).toBeInstanceOf(Password);
      expect(passwordInstance.value).toBe(password);
    },
  );

  it.each([
    {
      password: 'Abcdefgh1',
      comparedPassword: 'Abcdefgh1',
      isEqual: true,
    },
    {
      password: 'Abcdefgh1',
      comparedPassword: 'Abcdefgh2',
      isEqual: false,
    },
  ] as {
    password: string;
    comparedPassword: string;
    isEqual: boolean;
  }[])(
    'should return $isEqual when comparing $password with $comparedPassword',
    ({ password, comparedPassword, isEqual }) => {
      const passwordInstance = Password.create(password);
      const comparedPasswordInstance = Password.create(comparedPassword);

      expect(passwordInstance.equals(comparedPasswordInstance)).toBe(isEqual);
    },
  );
});
