import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { OrdersRepository } from '@/domain/showcase/application/gateways/repositories/orders-repository';
import { Order } from '@/domain/showcase/enterprise/entities/order';
import { Logger } from '@/shared/logger';
import { Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { MongoDBOrderMapper } from '../mappers/mongodb-order.mapper';
import { MongoOrderModel } from '../schemas/order.model';
import { MongoDbCostumerModel } from '../schemas/customer.model';

export class MongoDbOrdersRepository implements OrdersRepository {
  constructor(
    @Inject(MongoOrderModel.COLLECTION_NAME)
    private readonly orderModel: Model<MongoOrderModel>,
    private readonly logger: Logger,
  ) {}
  async findById(id: UniqueEntityID): Promise<Order | null> {
    try {
      this.logger.log(
        MongoDbOrdersRepository.name,
        `Finding order ${id.toString()}`,
      );

      const [order] = (await this.orderModel.aggregate([
        {
          $match: { id: id.toString() },
        },
        {
          $lookup: {
            from: MongoDbCostumerModel.COLLECTION_NAME,
            localField: 'customerId',
            foreignField: 'id',
            as: 'customer',
          },
        },
        {
          $unwind: '$customer',
        },
      ])) as MongoOrderModel[];

      if (!order) {
        return null;
      }

      this.logger.log(
        MongoDbOrdersRepository.name,
        `Order ${id.toString()} found`,
      );

      return MongoDBOrderMapper.toDomain(order);
    } catch (error: any) {
      this.logger.error(
        MongoDbOrdersRepository.name,
        `Error finding order ${id.toString()}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

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
