import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { OrdersRepository } from '@/domain/showcase/application/gateways/repositories/orders-repository';
import { Customer } from '@/domain/showcase/enterprise/entities/customer';
import { PaymentType } from '@/domain/showcase/enterprise/entities/enums/payment-type';
import { Order, OrderProps } from '@/domain/showcase/enterprise/entities/order';
import { PaymentMethod } from '@/domain/showcase/enterprise/entities/value-objects/payment-method';
import { Address } from '@/shared/value-objects/address';
import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { cpf } from 'cpf-cnpj-validator';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { ProductFactory } from 'test/products/enterprise/entities/make-product';

export function makeOrder(
  modifications?: Partial<OrderProps>,
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
      paymentMethod: PaymentMethod.create<PaymentType.PIX>({
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
@Injectable()
export class OrderFactory {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly userFactory: UserFactory,
    private readonly productFactory: ProductFactory,
  ) {}

  async makeOrder(
    modifications?: Partial<OrderProps>,
    createdAt?: Date,
  ): Promise<Order> {
    let customer = modifications?.customer;

    if (!customer) {
      const { user } = await this.userFactory.makeUser();
      customer = Customer.restore(
        {
          email: user.email.value,
          name: user.name,
        },
        user.id,
      );
    }

    const order = makeOrder(
      {
        customer,
      },
      createdAt,
    );

    if (!order.items.length) {
      const product = await this.productFactory.makeProduct();
      order.addItem(product, 1);
    }

    await this.ordersRepository.save(order);

    return order;
  }
}
