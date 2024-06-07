import { Encrypter } from '@/domain/auth/application/gateways/cryptography/encrypter';
import { Hasher } from '@/domain/auth/application/gateways/cryptography/hasher';
import { UsersRepository } from '@/domain/auth/application/gateways/repositories/user-repository';
import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { User, UserProps } from '@/domain/auth/enterprise/entities/user';
import { CPF } from '@/domain/auth/enterprise/entities/value-objects/cpf';
import { Email } from '@/domain/auth/enterprise/entities/value-objects/email';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { Address } from '@/shared/value-objects/address';
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
    private readonly userRepository: UsersRepository,
    private readonly hasher: Hasher,
    private readonly encypter: Encrypter,
  ) {}

  async makeUser(modifications?: Partial<UserProps>): Promise<{
    user: User;
    hashedPassword: string;
    plainPassword: string;
    accessToken: string;
  }> {
    const plainPassword = modifications?.password ?? faker.internet.password();
    const hashedPassword = await this.hasher.hash(plainPassword);
    const user = makeUser({
      password: hashedPassword,
      ...modifications,
    });

    await this.userRepository.save(user);

    const accessToken = await this.generateAccessToken(user);

    return {
      user,
      hashedPassword,
      plainPassword,
      accessToken,
    };
  }

  async generateAccessToken(user: User): Promise<string> {
    return this.encypter.encrypt<UserPayload>({
      sub: user.id.toString(),
    });
  }
}
