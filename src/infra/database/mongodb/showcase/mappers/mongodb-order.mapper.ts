import { Order } from '@/domain/showcase/enterprise/entities/order';
import { MongoOrderModel } from '../schemas/order.model';
import { Customer } from '@/domain/showcase/enterprise/entities/customer';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Address } from '@/shared/value-objects/address';
import { PaymentMethod } from '@/domain/showcase/enterprise/entities/value-objects/payment-method';
import { OrderItem } from '@/domain/showcase/enterprise/entities/value-objects/order-item';
import { MongoDbShowcaseProductsMapper } from './mongodb-showcase-product.mapper';

export class MongoDBOrderMapper {
  static toPersistence(order: Order): MongoOrderModel {
    return {
      _id: order.id.toString(),
      id: order.id.toString(),
      customerId: order.customer.id.toString(),
      deliveryAddress: order.deliveryAddress.toObject(),
      paymentMethod: order.paymentMethod.toObject(),
      items: order.items.map((item) => ({
        productId: item.product.id.toString(),
        quantity: item.quantity,
        price: item.price,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  static toDomain(model: MongoOrderModel): Order {
    return Order.restore(
      {
        customer: Customer.restore(
          {
            email: model.customer!.email,
            name: model.customer!.name,
          },
          new UniqueEntityID(model.customerId),
        ),
        deliveryAddress: Address.restore({
          address: model.deliveryAddress.address,
          cep: model.deliveryAddress.cep,
          city: model.deliveryAddress.city,
          number: model.deliveryAddress.number,
          state: model.deliveryAddress.state,
        }),
        paymentMethod: PaymentMethod.restore({
          details: model.paymentMethod.details,
          method: model.paymentMethod.method,
        }),
        items: model.items.map((item) =>
          OrderItem.restore({
            orderId: new UniqueEntityID(model.id),
            price: item.price,
            product: MongoDbShowcaseProductsMapper.toDomain(item.product!),
            quantity: item.quantity,
          }),
        ),
      },
      new UniqueEntityID(model.id),
      model.createdAt,
      model.updatedAt,
    );
  }
}
