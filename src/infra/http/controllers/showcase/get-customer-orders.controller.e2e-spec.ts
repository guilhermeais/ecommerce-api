import { DefaultExceptionFilter } from '@/infra/http/filters/default-exception-filter.filter';

import { EventManager } from '@/core/types/events';
import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { OrdersRepository } from '@/domain/showcase/application/gateways/repositories/orders-repository';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';
import { CategoryFactory } from 'test/products/enterprise/entities/make-category';
import { ProductFactory } from 'test/products/enterprise/entities/make-product';
import { OrderFactory } from 'test/showcase/enterprise/entities/make-order';
import { GetCustomerOrdersParams } from './get-customer-orders.controller';
import { Customer } from '@/domain/showcase/enterprise/entities/customer';
import { OrderPresenter } from './presenters/order-presenter';

describe('GetCustomerOrders (E2E)', () => {
  let app: INestApplication;
  let eventManager: EventManager;
  let userFactory: UserFactory;
  let productFactory: ProductFactory;
  let ordersRepository: OrdersRepository;
  let orderFactory: OrderFactory;

  beforeAll(async () => {
    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule, CryptographyModule],
      providers: [UserFactory, CategoryFactory, ProductFactory, OrderFactory],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalFilters(new DefaultExceptionFilter());

    eventManager = moduleRef.get(EventManager);
    userFactory = moduleRef.get(UserFactory);
    productFactory = moduleRef.get(ProductFactory);
    ordersRepository = moduleRef.get(OrdersRepository);
    orderFactory = moduleRef.get(OrderFactory);

    await app.init();
  });

  beforeEach(async () => {
    eventManager.clearSubscriptions();
  });

  function makeGetCustomerOrdersRequest(
    modifications?: Partial<GetCustomerOrdersParams>,
  ): GetCustomerOrdersParams {
    return {
      limit: 10,
      page: 1,
      ...modifications,
    };
  }

  describe('[GET] /orders', () => {
    it('should return empty if the customer does not have orders', async () => {
      const { accessToken } = await userFactory.makeUser({
        role: Role.USER,
      });

      const query = makeGetCustomerOrdersRequest();

      const response = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .query(query);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        items: [],
        currentPage: 1,
        limit: 10,
        pages: 0,
        total: 0,
      });
    });

    it('should get customer orders paginated', async () => {
      const { accessToken, user } = await userFactory.makeUser({
        role: Role.USER,
      });

      const orders = await Promise.all(
        Array.from({ length: 10 }).map(async (_, i) =>
          orderFactory.makeOrder(
            {
              customer: Customer.restore(
                {
                  email: user.email.value,
                  name: user.name,
                },
                user.id,
              ),
            },
            new Date(2021, 1, i + 1),
          ),
        ),
      );

      const query = makeGetCustomerOrdersRequest({
        limit: 5,
        page: 1,
      });

      const response = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .query(query);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        items: orders.splice(0, 5).map(OrderPresenter.toHTTP),
        currentPage: 1,
        limit: 5,
        pages: 2,
        total: 10,
      });

      const secondResponse = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          ...query,
          page: 2,
        });

      const secondItems = orders.splice(0, 5).map(OrderPresenter.toHTTP);

      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body).toEqual({
        items: secondItems,
        currentPage: 2,
        limit: 5,
        pages: 2,
        total: 10,
      });

      const thirdResponse = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          ...query,
          page: 3,
        });

      expect(thirdResponse.status).toBe(200);
      expect(thirdResponse.body).toEqual({
        items: [],
        currentPage: 3,
        limit: 5,
        pages: 2,
        total: 10,
      });
    });
  });
});
