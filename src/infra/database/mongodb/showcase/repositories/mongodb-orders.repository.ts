import { OrdersRepository } from '@/domain/showcase/application/gateways/repositories/orders-repository';
import { Logger } from '@/shared/logger';
import { Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { MongoOrderModel } from '../schemas/order.model';
import { Order } from '@/domain/showcase/enterprise/entities/order';
import { MongoDBOrderMapper } from '../mappers/mongodb-order.mapper';

export class MongoDbOrdersRepository implements OrdersRepository {
  constructor(
    @Inject(MongoOrderModel.COLLECTION_NAME)
    private readonly orderModel: Model<MongoOrderModel>,
    private readonly logger: Logger,
  ) {}

  async save(order: Order): Promise<void> {
    try {
      this.logger.log(
        MongoDbOrdersRepository.name,
        `Saving order ${order.id.toString()}`,
      );

      const exists = await this.orderModel.exists({ id: order.id.toString() });
      const orderModel = MongoDBOrderMapper.toPersistence(order);

      if (exists) {
        await this.orderModel.updateOne(
          { id: order.id.toString() },
          orderModel,
        );
      } else {
        await this.orderModel.create(orderModel);
      }

      this.logger.log(
        MongoDbOrdersRepository.name,
        `Order ${order.id.toString()} saved`,
      );
    } catch (error: any) {
      this.logger.error(
        MongoDbOrdersRepository.name,
        `Error saving order ${order.id.toString()}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
