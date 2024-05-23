import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import {
  CreateSignUpInviteData,
  FinishUserSignUpData,
  SignUpInvite,
} from '@/domain/auth/enterprise/entities/signup-invite';
import { Email } from '@/domain/auth/enterprise/entities/value-objects/email';
import { faker } from '@faker-js/faker';
import { UserFactory, makeUser } from './make-user';
import { Injectable } from '@nestjs/common';
import { SignUpInvitesRepository } from '@/domain/auth/application/gateways/repositories/sign-up-invites.repository';
import { CPF } from '@/domain/auth/enterprise/entities/value-objects/cpf';
import { cpf } from 'cpf-cnpj-validator';
import { Password } from '@/domain/auth/enterprise/entities/value-objects/password';

export function makeSignUpInvite(
  modifications?: Partial<CreateSignUpInviteData>,
): SignUpInvite {
  return SignUpInvite.create({
    guestEmail: Email.create(faker.internet.email()),
    guestName: faker.person.fullName(),
    sentBy: makeUser({
      role: Role.MASTER,
    }),
    ...modifications,
  });
}

export function makeFinishUserSignUpData(
  modifications?: Partial<FinishUserSignUpData>,
): FinishUserSignUpData {
  return {
    cpf: CPF.create(cpf.generate()),
    password: 'a1Bc$123',
    ...modifications,
  };
}

@Injectable()
export class SignUpInviteFactory {
  constructor(
    private readonly signUpInvitesRepository: SignUpInvitesRepository,
    private readonly userFactory: UserFactory,
  ) {}

  async makeSignUpInvite(
    modifications?: Partial<CreateSignUpInviteData>,
  ): Promise<SignUpInvite> {
    let sentBy = modifications?.sentBy;

    if (!sentBy) {
      const { user } = await this.userFactory.makeUser({
        role: Role.MASTER,
      });

      sentBy = user;
    }

    const signUpInvite = makeSignUpInvite({
      ...modifications,
      sentBy,
    });

    await this.signUpInvitesRepository.save(signUpInvite);

    return signUpInvite;
  }
}
