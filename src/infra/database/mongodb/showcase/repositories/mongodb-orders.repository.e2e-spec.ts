import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { INestApplication } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';

import { OrdersRepository } from '@/domain/showcase/application/gateways/repositories/orders-repository';
import { CategoryFactory } from 'test/products/enterprise/entities/make-category';
import { ProductFactory } from 'test/products/enterprise/entities/make-product';
import { MongoOrderModel } from '../schemas/order.model';
import { MongoDbOrdersRepository } from './mongodb-orders.repository';
import { makeOrder } from 'test/showcase/enterprise/entities/make-order';

describe('MongoDbOrdersRepository', () => {
  let app: INestApplication;
  let sut: MongoDbOrdersRepository;
  let orderModel: Model<MongoOrderModel>;
  let productFactory: ProductFactory;

  beforeAll(async () => {
    vi.useFakeTimers({
      now: new Date(),
    });

    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule, CryptographyModule],
      providers: [UserFactory, CategoryFactory, ProductFactory, UserFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    sut = moduleRef.get(OrdersRepository);
    orderModel = moduleRef.get(MongoOrderModel.COLLECTION_NAME);
    productFactory = moduleRef.get(ProductFactory);

    await app.init();
  });

  afterAll(async () => {
    vi.useRealTimers();
    await app.close();
  });

  describe('save()', () => {
    it('should save an order', async () => {
      const product = await productFactory.makeProduct();
      const order = makeOrder();

      order.addItem(product, 1);

      await sut.save(order);

      const storedOrder = await orderModel.findOne({ id: order.id.toString() });

      expect(storedOrder).toBeDefined();
      expect(storedOrder?.id).toBe(order.id.toString());
      expect(storedOrder?.costumerId).toBe(order.customer.id.toString());
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
        order.items[0].productId.toString(),
      );
      expect(storedOrder?.items[0].quantity).toEqual(order.items[0].quantity);

      expect(storedOrder?.createdAt).toEqual(order.createdAt);
      expect(storedOrder?.updatedAt).toEqual(order.updatedAt);
    });
  });
});
