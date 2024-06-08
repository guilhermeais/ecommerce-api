import { Address, AddressProps } from '@/shared/value-objects/address';
import { faker } from '@faker-js/faker';

export function makeAddress(modifications?: AddressProps): Address {
  return Address.create({
    address: faker.location.street(),
    cep: faker.location.zipCode(),
    city: faker.location.city(),
    state: faker.location.state(),
    ...modifications,
  });
}
