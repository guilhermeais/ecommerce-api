import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import {
  CreateSignUpInviteData,
  SignUpInvite,
} from '@/domain/auth/enterprise/entities/signup-invite';
import { Email } from '@/domain/auth/enterprise/entities/value-objects/email';
import { faker } from '@faker-js/faker';
import { makeUser } from './make-user';

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
