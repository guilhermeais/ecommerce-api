import { Hasher } from '@/domain/auth/application/gateways/cryptography/hasher';
import { UserRepository } from '@/domain/auth/application/gateways/repositories/user-repository';
import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { User, UserProps } from '@/domain/auth/enterprise/entities/user';
import { Address } from '@/domain/auth/enterprise/entities/value-objects/address';
import { CPF } from '@/domain/auth/enterprise/entities/value-objects/cpf';
import { Email } from '@/domain/auth/enterprise/entities/value-objects/email';
import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
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

@Injectable()
export class UserFactory {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hasher: Hasher,
  ) {}

  async makeUser(modifications?: Partial<UserProps>): Promise<{
    user: User;
    hashedPassword: string;
    plainPassword: string;
  }> {
    const plainPassword = modifications?.password ?? faker.internet.password();
    const hashedPassword = await this.hasher.hash(plainPassword);
    const user = makeUser({
      password: hashedPassword,
      ...modifications,
    });

    await this.userRepository.save(user);

    return {
      user,
      hashedPassword,
      plainPassword,
    };
  }
}
