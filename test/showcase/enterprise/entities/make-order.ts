import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Customer } from '@/domain/showcase/enterprise/entities/customer';
import { PaymentType } from '@/domain/showcase/enterprise/entities/enums/payment-type';
import { Order } from '@/domain/showcase/enterprise/entities/order';
import { PaymentMethod } from '@/domain/showcase/enterprise/entities/value-objects/payment-method';
import { Address } from '@/shared/value-objects/address';
import { faker } from '@faker-js/faker';
import { cpf } from 'cpf-cnpj-validator';

export function makeOrder(
  modifications?: Partial<Order>,
  createdAt?: Date,
  updatedAt?: Date,
): Order {
  const order = Order.create(
    {
      customer: Customer.restore(
        {
          email: faker.internet.email(),
          name: faker.person.fullName(),
        },
        new UniqueEntityID(),
      ),
      deliveryAddress: Address.create({
        address: faker.location.streetAddress(),
        cep: faker.location.zipCode(),
        city: faker.location.city(),
        state: faker.location.state(),
      }),
      paymentMethod: new PaymentMethod<PaymentType.PIX>({
        method: PaymentType.PIX,
        details: {
          customerKey: cpf.generate(),
        },
      }),
      ...modifications,
    },
    createdAt,
    updatedAt,
  );

  return order;
}
