import { cpf } from 'cpf-cnpj-validator';
import { CPF } from './cpf';
import { InvalidCPFError } from './errors/invalid-cpf-error';

describe('CPF', () => {
  it.each([
    '',
    '123456789',
    '1234567890',
    '12345678901',
    '123456789012',
    '1234567890123',
    '0000000000000',
    '1111111111111',
  ])('should throw InvalidCPFError when CPF.create(%s)', (cpf) => {
    expect(() => CPF.create(cpf)).toThrow(new InvalidCPFError(cpf));
  });

  it.each([cpf.generate()] as string[])(
    'should create a CPF instance when CPF.create("%s")',
    (cpf) => {
      const cpfInstance = CPF.create(cpf);

      expect(cpfInstance).toBeInstanceOf(CPF);
      expect(cpfInstance.value).toBe(cpf);
    },
  );

  const validCpf = cpf.generate();

  it.each([
    {
      cpf: cpf.generate(),
      comparedCPF: cpf.generate(),
      isEqual: false,
    },
    {
      cpf: validCpf,
      comparedCPF: validCpf,
      isEqual: true,
    },
  ] as { cpf: string; comparedCPF: string; isEqual: boolean }[])(
    'should return $isEqual when comparing $cpf with $comparedCPF',
    ({ cpf, comparedCPF, isEqual }) => {
      const cpfInstance = CPF.create(cpf);
      const comparedCPFInstance = CPF.create(comparedCPF);

      expect(cpfInstance.equals(comparedCPFInstance)).toBe(isEqual);
    },
  );
});
