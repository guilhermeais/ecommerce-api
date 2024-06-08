import { EventManager } from '@/core/types/events';
import { InMemoryOrdersRepository } from '@/infra/database/in-memory/repositories/showcase/in-memory-orders.repository';
import { InMemoryShowcaseProductRepository } from '@/infra/database/in-memory/repositories/showcase/in-memory-showcase-products-repository';
import { Logger } from '@/shared/logger';
import { faker } from '@faker-js/faker';
import { cpf } from 'cpf-cnpj-validator';
import { FakeEventManager } from 'test/core/type/event/fake-event-manager';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { makeShowcaseProduct } from 'test/showcase/enterprise/entities/make-showcase-product';
import { PaymentType } from '../../enterprise/entities/enums/payment-type';
import { PixPaymentDetails } from '../../enterprise/entities/value-objects/payment-method';
import { CheckoutRequest, CheckoutUseCase } from './checkout';
import { ItemAlreadyPlacedError } from './errors/item-already-placed-error';
import { InvalidOrderItemError } from './errors/invalid-order-item-error';

describe('Checkout UseCase', () => {
  let sut: CheckoutUseCase;
  let ordersRepository: InMemoryOrdersRepository;
  let productRepository: InMemoryShowcaseProductRepository;
  let logger: Logger;
  let eventManager: EventManager;

  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    productRepository = new InMemoryShowcaseProductRepository();
    logger = makeFakeLogger();
    eventManager = new FakeEventManager();

    sut = new CheckoutUseCase(
      ordersRepository,
      productRepository,
      logger,
      eventManager,
    );
  });

  function makeCheckoutRequest(
    modifications?: Partial<CheckoutRequest<PixPaymentDetails>>,
  ): CheckoutRequest<PixPaymentDetails> {
    const items = modifications?.items || [];

    if (!items.length) {
      const product = makeShowcaseProduct();
      productRepository.products.push(product);

      items.push({
        productId: product.id.toString(),
        quantity: 1,
      });
    }
    return {
      customer: {
        email: faker.internet.email(),
        id: faker.string.uuid(),
        name: faker.person.fullName(),
      },
      deliveryAddress: {
        address: faker.location.street(),
        cep: faker.location.zipCode(),
        city: faker.location.city(),
        state: faker.location.state(),
      },
      paymentMethod: PaymentType.PIX,
      paymentDetails: {
        customerKey: cpf.generate(),
      },
      items,
    };
  }

  it('should place an order', async () => {
    const request = makeCheckoutRequest();
    const order = await sut.execute(request);

    expect(order).toBeTruthy();
    expect(order.customer.email).toBe(request.customer.email);
    expect(order.customer.name).toBe(request.customer.name);
    expect(order.deliveryAddress.address).toBe(request.deliveryAddress.address);
    expect(order.deliveryAddress.cep).toBe(request.deliveryAddress.cep);
    expect(order.deliveryAddress.city).toBe(request.deliveryAddress.city);
    expect(order.deliveryAddress.state).toBe(request.deliveryAddress.state);
    expect(order.paymentMethod.method).toBe(request.paymentMethod);
    expect(order.paymentMethod.details.customerKey).toBe(
      request.paymentDetails.customerKey,
    );
    expect(order.items.length).toBe(1);

    const item = order.items[0];

    expect(item.productId.toString()).toBe(request.items[0].productId);
    expect(item.quantity).toBe(request.items[0].quantity);

    expect(ordersRepository.orders.length).toBe(1);
    expect(ordersRepository.orders[0]).toEqual(order);
  });

  it('should not place an order with duplicated items', async () => {
    const product = makeShowcaseProduct();
    productRepository.products.push(product);

    const request = makeCheckoutRequest({
      items: [
        {
          productId: product.id.toString(),
          quantity: 1,
        },
        {
          productId: product.id.toString(),
          quantity: 2,
        },
      ],
    });

    await expect(sut.execute(request)).rejects.toThrowError(
      new ItemAlreadyPlacedError(product.name, 0),
    );
  });

  it('should not place an order with unexisting product', async () => {
    const productId = faker.string.uuid();
    const request = makeCheckoutRequest({
      items: [
        {
          productId,
          quantity: 1,
        },
      ],
    });

    await expect(sut.execute(request)).rejects.toThrowError(
      new InvalidOrderItemError(
        0,
        `Produto com id ${productId} não encontrado.`,
      ),
    );
  });
});
