import { Logger } from '@/shared/logger';
import {
  GetCustomerOrders,
  GetCustomerOrdersRequest,
} from './get-customer-orders';
import { OrdersRepository } from '../gateways/repositories/orders-repository';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { InMemoryOrdersRepository } from '@/infra/database/in-memory/repositories/showcase/in-memory-orders.repository';
import { faker } from '@faker-js/faker';
import { makeCustomer } from 'test/showcase/enterprise/entities/make-customer';
import { makeOrder } from 'test/showcase/enterprise/entities/make-order';

describe('GetCustomerOrders', () => {
  let sut: GetCustomerOrders;
  let logger: Logger;
  let ordersRepository: OrdersRepository;

  beforeEach(() => {
    logger = makeFakeLogger();
    ordersRepository = new InMemoryOrdersRepository();

    sut = new GetCustomerOrders(logger, ordersRepository);
  });

  function makeGetCustomerOrdersRequest(
    modifications?: Partial<GetCustomerOrdersRequest>,
  ): GetCustomerOrdersRequest {
    return {
      customerId: faker.string.uuid(),
      limit: 1,
      page: 1,
      ...modifications,
    };
  }

  it('should list empty orders if the customer does not have orders', async () => {
    const request = makeGetCustomerOrdersRequest();

    const response = await sut.execute(request);

    expect(response.items).toHaveLength(0);
    expect(response.total).toBe(0);
    expect(response.pages).toBe(0);
  });

  it('should get all orders of the customer', async () => {
    const customer = makeCustomer();
    await Promise.all(
      Array.from({ length: 10 }).map(async () => {
        await ordersRepository.save(
          makeOrder({
            customer,
          }),
        );
      }),
    );

    const request = makeGetCustomerOrdersRequest({
      customerId: customer.id.toString(),
      limit: 5,
    });

    const response = await sut.execute(request);

    expect(response.items).toHaveLength(5);
    expect(response.total).toBe(10);
    expect(response.pages).toEqual(2);

    const secondPageRequest = makeGetCustomerOrdersRequest({
      customerId: customer.id.toString(),
      limit: 5,
      page: 2,
    });

    const secondPageResponse = await sut.execute(secondPageRequest);

    expect(secondPageResponse.items).toHaveLength(5);
    expect(secondPageResponse.total).toBe(10);
    expect(secondPageResponse.pages).toEqual(2);
  });
});
