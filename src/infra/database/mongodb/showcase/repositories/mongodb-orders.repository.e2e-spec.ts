import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { INestApplication } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';

import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { OrdersRepository } from '@/domain/showcase/application/gateways/repositories/orders-repository';
import { Customer } from '@/domain/showcase/enterprise/entities/customer';
import { CategoryFactory } from 'test/products/enterprise/entities/make-category';
import { ProductFactory } from 'test/products/enterprise/entities/make-product';
import {
  OrderFactory,
  makeOrder,
} from 'test/showcase/enterprise/entities/make-order';
import { MongoOrderModel } from '../schemas/order.model';
import { MongoDbOrdersRepository } from './mongodb-orders.repository';

describe('MongoDbOrdersRepository', () => {
  let app: INestApplication;
  let sut: MongoDbOrdersRepository;
  let orderModel: Model<MongoOrderModel>;
  let productFactory: ProductFactory;
  let orderFactory: OrderFactory;
  let userFactory: UserFactory;

  beforeAll(async () => {
    vi.useFakeTimers({
      now: new Date(),
    });

    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule, CryptographyModule],
      providers: [
        UserFactory,
        CategoryFactory,
        ProductFactory,
        OrderFactory,
        UserFactory,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    sut = moduleRef.get(OrdersRepository);
    orderModel = moduleRef.get(MongoOrderModel.COLLECTION_NAME);
    productFactory = moduleRef.get(ProductFactory);
    orderFactory = moduleRef.get(OrderFactory);
    userFactory = moduleRef.get(UserFactory);

    await app.init();
  });

  afterAll(async () => {
    vi.useRealTimers();
    await app.close();
  });

  describe('save()', () => {
    it('should save an order', async () => {
      const product = await productFactory.makeProduct({
        isShown: true,
      });
      const order = makeOrder();

      order.addItem(product, 1);

      await sut.save(order);

      const storedOrder = await orderModel.findOne({ id: order.id.toString() });

      expect(storedOrder).toBeDefined();
      expect(storedOrder?.id).toBe(order.id.toString());
      expect(storedOrder?.customerId).toBe(order.customer.id.toString());
      expect(storedOrder?.deliveryAddress.address).toEqual(
        order.deliveryAddress.address,
      );
      expect(storedOrder?.deliveryAddress.cep).toEqual(
        order.deliveryAddress.cep,
      );
      expect(storedOrder?.deliveryAddress.city).toEqual(
        order.deliveryAddress.city,
      );
      expect(storedOrder?.deliveryAddress.state).toEqual(
        order.deliveryAddress.state,
      );
      expect(storedOrder?.deliveryAddress.number).toEqual(
        order.deliveryAddress.number,
      );
      expect(storedOrder?.paymentMethod.method).toEqual(
        order.paymentMethod.method,
      );
      expect(storedOrder?.paymentMethod.details).toEqual(
        order.paymentMethod.details,
      );
      expect(storedOrder?.items.length).toEqual(order.items.length);
      expect(storedOrder?.items[0].price).toEqual(order.items[0].price);
      expect(storedOrder?.items[0].productId).toEqual(
        order.items[0].product.id.toString(),
      );
      expect(storedOrder?.items[0].quantity).toEqual(order.items[0].quantity);

      expect(storedOrder?.createdAt).toEqual(order.createdAt);
      expect(storedOrder?.updatedAt).toEqual(order.updatedAt);
    });
  });

  describe('findById()', () => {
    it('should get null if any order is found', async () => {
      const order = await sut.findById(new UniqueEntityID());

      expect(order).toBeNull();
    });

    it.only('should get and existing order', async () => {
      const order = await orderFactory.makeOrder();

      const foundOrder = await sut.findById(order.id);

      expect(foundOrder!.id).toEqual(order.id);
      expect(foundOrder!.items).toEqual(order.items);
      expect(foundOrder!.deliveryAddress).toEqual(order.deliveryAddress);
      expect(foundOrder!.paymentMethod).toEqual(order.paymentMethod);
      expect(foundOrder!.customer).toEqual(order.customer);
      expect(foundOrder!.total).toEqual(order.total);
      expect(foundOrder!.createdAt).toEqual(order.createdAt);
      expect(foundOrder!.updatedAt).toEqual(order.updatedAt);
    });
  });

  describe('list()', () => {
    it('should return empty if the customer does not have orders', async () => {
      const orders = await sut.list({
        customerId: new UniqueEntityID(),
        page: 1,
        limit: 10,
      });

      expect(orders.items).toHaveLength(0);
      expect(orders.total).toBe(0);
      expect(orders.pages).toBe(0);
      expect(orders.currentPage).toBe(1);
      expect(orders.limit).toBe(10);
    });

    it('should paginate customer orders', async () => {
      const { user } = await userFactory.makeUser();
      const customer = Customer.restore(
        {
          email: user.email.value,
          name: user.name,
        },
        user.id,
      );

      await Promise.all(
        Array.from({ length: 15 }).map((_, i) =>
          orderFactory.makeOrder(
            {
              customer,
            },
            new Date(2021, 1, i + 1),
          ),
        ),
      );

      const firstResponse = await sut.list({
        customerId: customer.id,
        page: 1,
        limit: 10,
      });

      expect(firstResponse.items).toHaveLength(10);
      expect(firstResponse.total).toBe(15);
      expect(firstResponse.pages).toEqual(2);

      const secondResponse = await sut.list({
        customerId: customer.id,
        page: 2,
        limit: 10,
      });

      expect(secondResponse.items).toHaveLength(5);
      expect(secondResponse.total).toBe(15);
      expect(secondResponse.pages).toEqual(2);
    });
  });
});
