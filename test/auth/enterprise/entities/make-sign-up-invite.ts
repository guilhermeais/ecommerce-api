import {
  SignUpInvite,
  SignUpInviteProps,
} from '@/domain/auth/enterprise/entities/signup-invite';
import { Email } from '@/domain/auth/enterprise/entities/value-objects/email';
import { makeUser } from './make-user';
import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { faker } from '@faker-js/faker';

export function makeSignUpInvite(
  modifications?: Partial<SignUpInviteProps>,
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
