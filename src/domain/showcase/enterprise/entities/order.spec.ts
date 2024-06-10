import { makeCustomer } from 'test/showcase/enterprise/entities/make-customer';
import { Order } from './order';
import { makeAddress } from 'test/shared/value-objects/make-address';
import { makePayment } from 'test/showcase/enterprise/entities/make-payment';
import { makeShowcaseProduct } from 'test/showcase/enterprise/entities/make-showcase-product';
import { InvalidOrderItemError } from '../../application/use-cases/errors/invalid-order-item-error';
import { ItemAlreadyPlacedError } from '../../application/use-cases/errors/item-already-placed-error';

describe('Order', () => {
  it('should create an order with valid items', async () => {
    const order = Order.create({
      customer: makeCustomer(),
      deliveryAddress: makeAddress(),
      paymentMethod: makePayment(),
    });

    order.addItem(
      makeShowcaseProduct({
        price: 100,
      }),
      1,
    );

    order.addItem(
      makeShowcaseProduct({
        price: 200,
      }),
      2,
    );

    expect(order.items.length).toBe(2);
    expect(order.total).toBe(500);
  });

  it('should throw if the quantity is invlaid', async () => {
    const order = Order.create({
      customer: makeCustomer(),
      deliveryAddress: makeAddress(),
      paymentMethod: makePayment(),
    });

    expect(() => {
      order.addItem(
        makeShowcaseProduct({
          price: 100,
        }),
        -1,
      );
    }).toThrow(new InvalidOrderItemError(0, `Quantidade deve ser maior que 0`));
  });

  it('should throw ItemAlreadyPlacedError if the item is already placed', async () => {
    const order = Order.create({
      customer: makeCustomer(),
      deliveryAddress: makeAddress(),
      paymentMethod: makePayment(),
    });

    const product = makeShowcaseProduct({
      price: 100,
    });

    order.addItem(product, 1);

    expect(() => {
      order.addItem(product, 1);
    }).toThrow(new ItemAlreadyPlacedError(product.name, 0));
  });
});
