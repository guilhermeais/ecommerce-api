import { Order } from '@/domain/showcase/enterprise/entities/order';
import { MongoOrderModel } from '../schemas/order.model';

export class MongoDBOrderMapper {
  static toPersistence(order: Order): MongoOrderModel {
    return {
      _id: order.id.toString(),
      id: order.id.toString(),
      costumerId: order.customer.id.toString(),
      deliveryAddress: order.deliveryAddress.toObject(),
      paymentMethod: order.paymentMethod.toObject(),
      items: order.items.map((item) => ({
        productId: item.productId.toString(),
        quantity: item.quantity,
        price: item.price,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
