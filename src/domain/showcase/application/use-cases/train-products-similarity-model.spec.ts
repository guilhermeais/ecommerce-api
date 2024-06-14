import { InMemoryOrdersRepository } from '@/infra/database/in-memory/repositories/showcase/in-memory-orders.repository';
import { Logger } from '@/shared/logger';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { FakeProductSimilarityModel } from 'test/showcase/application/gateways/gateways/fake-product-similarity-model';
import { makeOrder } from 'test/showcase/enterprise/entities/make-order';
import { makeShowcaseProduct } from 'test/showcase/enterprise/entities/make-showcase-product';
import { OrderItem } from '../../enterprise/entities/value-objects/order-item';
import { TrainData } from '../gateways/gateways/product-similarity-model-gateway';
import { OrdersRepository } from '../gateways/repositories/orders-repository';
import { TrainProductsSimilarityModelUseCase } from './train-products-similarity-model';

describe('TrainProductsSimilarityModelUseCase', () => {
  let sut: TrainProductsSimilarityModelUseCase;
  let logger: Logger;
  let productsSimilarityModelGateway: FakeProductSimilarityModel;
  let ordersRepository: OrdersRepository;

  beforeEach(() => {
    logger = makeFakeLogger();
    productsSimilarityModelGateway = new FakeProductSimilarityModel();
    ordersRepository = new InMemoryOrdersRepository();

    sut = new TrainProductsSimilarityModelUseCase(
      logger,
      productsSimilarityModelGateway,
      ordersRepository,
    );
  });

  it('should train the model with all orders', async () => {
    const orders = await Promise.all(
      Array.from({ length: 10 }, async () => {
        const order = makeOrder();
        order.addItem(makeShowcaseProduct(), 1);
        order.addItem(makeShowcaseProduct(), 1);
        await ordersRepository.save(order);

        return order;
      }),
    );

    await sut.execute();

    const expectedTrainedData = orders
      .map((order) => {
        return order.items.map(
          (item: OrderItem) =>
            ({
              sellId: order.id,
              productId: item.product.id,
              quantity: item.quantity,
              unitPrice: item.price,
            }) as TrainData,
        );
      })
      .flat();

    const { trainedData } = productsSimilarityModelGateway;

    expect(trainedData).toEqual(expectedTrainedData);
  });
});
