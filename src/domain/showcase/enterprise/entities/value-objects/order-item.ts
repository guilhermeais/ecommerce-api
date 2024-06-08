import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { ValueObject } from '@/core/entities/value-object';

export type OrderItemProps = {
  orderId: UniqueEntityID;
  productId: UniqueEntityID;
  quantity: number;
  price: number;
};

export class OrderItem extends ValueObject<OrderItemProps> {
  static create(props: OrderItemProps): OrderItem {
    return new OrderItem(props);
  }

  static restore(props: OrderItemProps): OrderItem {
    return new OrderItem(props);
  }

  get orderId() {
    return this.props.orderId;
  }

  get productId() {
    return this.props.productId;
  }

  get quantity() {
    return this.props.quantity;
  }

  get price() {
    return this.props.price;
  }
}
