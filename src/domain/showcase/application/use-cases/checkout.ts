import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { BadRequestError } from '@/core/errors/commom/bad-request.error';
import { EventManager, Events } from '@/core/types/events';
import { UseCase } from '@/core/types/use-case';
import { Logger } from '@/shared/logger';
import { Address } from '@/shared/value-objects/address';
import { Customer } from '../../enterprise/entities/customer';
import { PaymentType } from '../../enterprise/entities/enums/payment-type';
import { Order } from '../../enterprise/entities/order';
import {
  BoletoPaymentDetails,
  CardPaymentDetails,
  PaymentMethod,
  PixPaymentDetails,
} from '../../enterprise/entities/value-objects/payment-method';
import { OrdersRepository } from '../gateways/repositories/orders-repository';
import { ShowcaseProductsRepository } from '../gateways/repositories/showcase-products-repository';
import { InvalidOrderItemError } from './errors/invalid-order-item-error';

export type CheckoutRequest<
  PaymentDetails =
    | PixPaymentDetails
    | CardPaymentDetails
    | BoletoPaymentDetails,
> = {
  items: {
    productId: string;
    quantity: number;
  }[];
  paymentMethod: PaymentType;
  paymentDetails: PaymentDetails;
  deliveryAddress: {
    cep: string;
    address: string;
    number?: string;
    state: string;
    city: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
  };
};

export type CheckoutResponse = Order;

export class CheckoutUseCase
  implements UseCase<CheckoutRequest, CheckoutResponse>
{
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly productRepository: ShowcaseProductsRepository,
    private readonly logger: Logger,
    private readonly eventManager: EventManager,
  ) {}

  async execute(request: CheckoutRequest): Promise<Order> {
    try {
      const customer = Customer.restore(
        {
          email: request.customer.email,
          name: request.customer.name,
        },
        new UniqueEntityID(request.customer.id),
      );

      this.logger.log(
        CheckoutUseCase.name,
        `Placing order for customer ${customer.id.toString()} with: ${JSON.stringify(request, null, 2)}`,
      );
      const { items } = request;

      const paymentMethod = new PaymentMethod({
        details: request.paymentDetails,
        method: request.paymentMethod,
      });
      const deliveryAddress = Address.create(request.deliveryAddress);

      const order = Order.create({
        customer,
        paymentMethod,
        deliveryAddress,
      });

      if (items.length === 0) {
        throw new BadRequestError(`Deve haver ao menos 1 item no pedido.`);
      }

      for (const [index, item] of Object.entries(items)) {
        const productId = new UniqueEntityID(item.productId);
        const product = await this.productRepository.findById(productId);

        if (!product) {
          throw new InvalidOrderItemError(
            index,
            `Produto com id ${item.productId} não encontrado.`,
          );
        }

        order.addItem(product, item.quantity);
      }

      await this.ordersRepository.save(order);

      await this.eventManager.publish(Events.ORDER_CREATED, order);

      this.logger.log(
        CheckoutUseCase.name,
        `Order for customer ${customer.id.toString()} placed successfully with ${order.items.length} items and total ${order.total}`,
      );

      return order;
    } catch (error: any) {
      this.logger.error(
        CheckoutUseCase.name,
        `Error on placing order with ${JSON.stringify(request, null, 2)}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
