import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { ValueObject } from '@/core/entities/value-object';
import { ShowcaseProduct } from '../showcase-product';
import { InvalidOrderItemError } from '@/domain/showcase/application/use-cases/errors/invalid-order-item-error';

export type OrderItemProps = {
  orderId: UniqueEntityID;
  product: ShowcaseProduct;
  quantity: number;
  price: number;
};

export class OrderItem extends ValueObject<OrderItemProps> {
  static create(props: OrderItemProps): OrderItem {
    if (props.quantity <= 0) {
      throw new InvalidOrderItemError(0, `Quantidade deve ser maior que 0`);
    }

    return new OrderItem(props);
  }

  static restore(props: OrderItemProps): OrderItem {
    return new OrderItem(props);
  }

  get orderId() {
    return this.props.orderId;
  }

  get product() {
    return this.props.product;
  }

  get quantity() {
    return this.props.quantity;
  }

  get price() {
    return this.props.price;
  }

  get total() {
    return this.price * this.quantity;
  }
}
