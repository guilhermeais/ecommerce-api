import { UseCase } from '@/core/types/use-case';
import { Logger } from '@/shared/logger';
import { Order } from '../../enterprise/entities/order';
import {
  ProductSimilarityModelGateway,
  TrainDataGenerator,
} from '../gateways/gateways/product-similarity-model-gateway';
import { OrdersRepository } from '../gateways/repositories/orders-repository';
import { Injectable } from '@nestjs/common';

export type TrainProductsSimilarityModelRequest = undefined;
export type TrainProductsSimilarityModelResponse = void;

@Injectable()
export class TrainProductsSimilarityModelUseCase
  implements
    UseCase<
      TrainProductsSimilarityModelRequest,
      TrainProductsSimilarityModelResponse
    >
{
  constructor(
    private readonly logger: Logger,
    private readonly productsSimilarityModelGateway: ProductSimilarityModelGateway,
    private readonly ordersRepository: OrdersRepository,
  ) {}

  async execute(): Promise<void> {
    try {
      const startDate = new Date();
      this.logger.log(
        TrainProductsSimilarityModelUseCase.name,
        `Starting training products similarity model on demand at ${startDate.toISOString()}`,
      );

      const ordersGenerator = this.ordersRepository.findAllOnDemand();

      await this.productsSimilarityModelGateway.train(
        this.toTrainData(ordersGenerator),
      );

      const duration = new Date().getTime() - startDate.getTime();
      this.logger.log(
        TrainProductsSimilarityModelUseCase.name,
        `Products similarity model trained in ${duration}ms`,
      );
    } catch (error: any) {
      this.logger.error(
        TrainProductsSimilarityModelUseCase.name,
        `Error training products similarity model: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  private async *toTrainData(
    ordersGenerator: AsyncGenerator<Order>,
  ): TrainDataGenerator {
    for await (const order of ordersGenerator) {
      for (const item of order.items) {
        yield {
          sellId: order.id,
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.price,
        };
      }
    }
  }
}
