import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { User, UserProps } from '@/domain/auth/enterprise/entities/user';
import { Address } from '@/domain/auth/enterprise/entities/value-objects/address';
import { CPF } from '@/domain/auth/enterprise/entities/value-objects/cpf';
import { Email } from '@/domain/auth/enterprise/entities/value-objects/email';
import { faker } from '@faker-js/faker';
import { cpf } from 'cpf-cnpj-validator';

export function makeUser(modifications?: Partial<UserProps>): User {
  return User.create({
    cpf: CPF.create(cpf.generate()),
    address: Address.create({
      address: faker.location.street(),
      cep: faker.location.zipCode(),
      city: faker.location.city(),
      state: faker.location.state(),
      number: faker.location.zipCode(),
    }),
    email: Email.create(faker.internet.email()),
    name: faker.person.fullName(),
    password: faker.internet.password(),
    phone: faker.phone.number(),
    role: Role.USER,
    ...modifications,
  });
}
