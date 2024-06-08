import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Address } from '@/shared/value-objects/address';
import { ItemAlreadyPlacedError } from '../../application/use-cases/errors/item-already-placed-error';
import { Customer } from './customer';
import { ShowcaseProduct } from './showcase-product';
import { OrderItem } from './value-objects/order-item';
import { PaymentMethod } from './value-objects/payment-method';

export type OrderProps = {
  customer: Customer;
  paymentMethod: PaymentMethod;
  deliveryAddress: Address;
  items?: OrderItem[];
};

export class Order extends Entity<OrderProps> {
  private _items: OrderItem[] = [];

  static create(props: OrderProps, createdAt?: Date, updatedAt?: Date) {
    return new Order(props, undefined, createdAt, updatedAt);
  }

  static restore(
    props: OrderProps,
    id: UniqueEntityID,
    createdAt: Date,
    updatedAt?: Date,
  ) {
    return new Order(props, id, createdAt, updatedAt);
  }

  private constructor(
    props: OrderProps,
    id?: UniqueEntityID,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(props, id, createdAt, updatedAt);
    this._items = props.items || [];
  }

  addItem(product: ShowcaseProduct, quantity: number) {
    const newItem = OrderItem.create({
      orderId: this.id,
      price: product.price,
      productId: product.id,
      quantity,
    });

    const duplicatedItemIndex = this._items.findIndex((item) =>
      item.productId.equals(newItem.productId),
    );

    if (duplicatedItemIndex !== -1) {
      throw new ItemAlreadyPlacedError(product.name, duplicatedItemIndex);
    }

    this._items.push(newItem);
  }

  get total() {
    return this._items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  }

  get items() {
    return this._items;
  }

  get customer() {
    return this.props.customer;
  }

  get paymentMethod() {
    return this.props.paymentMethod;
  }

  get deliveryAddress() {
    return this.props.deliveryAddress;
  }
}
