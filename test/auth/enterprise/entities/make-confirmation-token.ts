import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import {
  ConfirmationToken,
  ConfirmationTokenProps,
} from '@/domain/auth/enterprise/entities/confirmation-token';
import { Email } from '@/domain/auth/enterprise/entities/value-objects/email';
import { faker } from '@faker-js/faker';

export function makeConfirmationToken(
  modifications?: Partial<ConfirmationTokenProps>,
): ConfirmationToken {
  return ConfirmationToken.create({
    email: Email.create(faker.internet.email()),
    userId: new UniqueEntityID(),
    expiresIn: 1000 * 60 * 60 * 24,
    userName: faker.person.fullName(),
    ...modifications,
  });
}
