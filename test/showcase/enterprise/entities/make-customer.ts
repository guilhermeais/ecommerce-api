import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Customer } from '@/domain/showcase/enterprise/entities/customer';
import { faker } from '@faker-js/faker';

export function makeCustomer(modifications?: Partial<Customer>): Customer {
  const customer = Customer.restore(
    {
      email: faker.internet.email(),
      name: faker.person.fullName(),
      ...modifications,
    },
    new UniqueEntityID(),
  );

  return customer;
}
