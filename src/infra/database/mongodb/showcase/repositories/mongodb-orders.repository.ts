import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';
import { OrdersRepository } from '@/domain/showcase/application/gateways/repositories/orders-repository';
import { Order } from '@/domain/showcase/enterprise/entities/order';
import { Logger } from '@/shared/logger';
import { Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { MongoCategoryModel } from '../../products/schemas/category.model';
import { MongoDBOrderMapper } from '../mappers/mongodb-order.mapper';
import { MongoDbCostumerModel } from '../schemas/customer.model';
import { MongoOrderModel } from '../schemas/order.model';
import { ShowcaseProductModel } from '../schemas/showcase-product.model';

export class MongoDbOrdersRepository implements OrdersRepository {
  constructor(
    @Inject(MongoOrderModel.COLLECTION_NAME)
    private readonly orderModel: Model<MongoOrderModel>,
    @Inject(ShowcaseProductModel.COLLECTION_NAME)
    private readonly productModel: Model<ShowcaseProductModel>,
    private readonly logger: Logger,
  ) {}

  async list(
    request: PaginatedRequest<Partial<{ customerId: UniqueEntityID }>>,
  ): Promise<PaginatedResponse<Order>> {
    try {
      this.logger.log(
        MongoDbOrdersRepository.name,
        `Listing orders with ${JSON.stringify(request)}`,
      );

      const { page, limit, customerId } = request;
      const skip = (page - 1) * limit;

      const [result] = (await this.orderModel.aggregate([
        {
          $match: {
            ...(customerId && { customerId: customerId?.toString() }),
          },
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
        { $sort: { createdAt: 1 } },
        {
          $facet: {
            items: [{ $skip: skip }, { $limit: limit }],
            metadata: [{ $count: 'total' }],
          },
        },
      ])) as {
        metadata: { total: number }[];
        items: MongoOrderModel[];
      }[];

      const [metadata] = result?.metadata;

      const total = metadata?.total ?? 0;
      const pages = Math.ceil(total / limit);

      this.logger.log(
        MongoDbOrdersRepository.name,
        `Found ${total} orders with ${JSON.stringify(request)}`,
      );

      const enrichedOrders = await Promise.all(
        result.items.map((order) => this.enrichOrder(order)),
      );

      return {
        items: enrichedOrders.map(MongoDBOrderMapper.toDomain),
        total,
        pages,
        limit,
        currentPage: page,
      };
    } catch (error: any) {
      this.logger.error(
        MongoDbOrdersRepository.name,
        `Error listing showcase orders with ${JSON.stringify(request)}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

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

      const enrichedOrder = await this.enrichOrder(order);

      return MongoDBOrderMapper.toDomain(enrichedOrder);
    } catch (error: any) {
      this.logger.error(
        MongoDbOrdersRepository.name,
        `Error finding order ${id.toString()}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async enrichOrder(order: MongoOrderModel): Promise<MongoOrderModel> {
    const { items } = order;

    const productsHashMap = new Map<string, ShowcaseProductModel | undefined>();

    const newItems = await Promise.all(
      items.map(async (item) => {
        let product = productsHashMap.get(item.productId);

        if (!product) {
          const [productOnDb] = (await this.productModel.aggregate([
            {
              $match: {
                id: item.productId,
              },
            },
            {
              $lookup: {
                from: MongoCategoryModel.COLLECTION_NAME,
                localField: 'subCategoryId',
                foreignField: 'id',
                as: 'category',
              },
            },
            {
              $unwind: {
                path: '$category',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: MongoCategoryModel.COLLECTION_NAME,
                localField: 'category.rootCategoryId',
                foreignField: 'id',
                as: 'rootCategory',
              },
            },
            {
              $unwind: {
                path: '$rootCategory',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $addFields: {
                'category.rootCategory': '$rootCategory',
              },
            },
          ])) as ShowcaseProductModel[];
          product = productOnDb;
          productsHashMap.set(item.productId, product);
        }

        return {
          ...item,
          product,
        };
      }),
    );

    return {
      ...order,
      items: newItems,
    };
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

  async *findAllOnDemand(): AsyncGenerator<Order, any, unknown> {
    this.logger.log(
      MongoDbOrdersRepository.name,
      `Finding all orders on demand`,
    );
    const cursor = this.orderModel
      .aggregate<MongoOrderModel>([
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
        { $sort: { createdAt: 1 } },
      ])
      .cursor({
        batchSize: 1000,
      });

    for await (const doc of cursor) {
      const enrichedOrder = await this.enrichOrder(doc);
      yield MongoDBOrderMapper.toDomain(enrichedOrder);
    }
  }
}
