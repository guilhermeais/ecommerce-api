import { SignUpBody } from '@/infra/http/controllers/auth/client-sign-up.controller';
import { faker } from '@faker-js/faker';
import { cpf } from 'cpf-cnpj-validator';

export function makeSignUpBody(overrides?: Partial<SignUpBody>): SignUpBody {
  return {
    cpf: cpf.generate(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    password: 'abC123!@',
    phone: faker.phone.number(),
    address: {
      address: faker.location.street(),
      cep: faker.location.zipCode(),
      city: faker.location.city(),
      number: faker.location.zipCode().toString(),
      state: faker.location.state(),
    },
    ...overrides,
  };
}
