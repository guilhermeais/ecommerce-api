import { UseCase } from '@/core/types/use-case';
import { Logger } from '@/shared/logger';
import { Address } from '@/shared/value-objects/address';
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
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { EventManager, Events } from '@/core/types/events';

export type CheckoutRequest = {
  items: {
    productId: string;
    quantity: number;
  }[];
  paymentMethod: PaymentType;
  paymentDetails: PixPaymentDetails | CardPaymentDetails | BoletoPaymentDetails;
  deliveryAddress: {
    cep: string;
    address: string;
    number?: string;
    state: string;
    city: string;
  };
  customerId: string;
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
      this.logger.log(
        CheckoutUseCase.name,
        `Placing order for customer ${request.customerId} with: ${JSON.stringify(request, null, 2)}`,
      );
      const { items } = request;

      const customerId = new UniqueEntityID(request.customerId);
      const paymentMethod = new PaymentMethod({
        details: request.paymentDetails,
        method: request.paymentMethod,
      });
      const deliveryAddress = Address.create(request.deliveryAddress);

      const order = Order.create({
        customerId,
        paymentMethod,
        deliveryAddress,
      });

      for (const item of items) {
        const productId = new UniqueEntityID(item.productId);
        const product = await this.productRepository.findById(productId);

        if (!product) {
          throw new EntityNotFoundError('Produto', productId.toString());
        }

        order.addItem(product, item.quantity);
      }

      await this.ordersRepository.save(order);

      await this.eventManager.publish(Events.ORDER_CREATED, order);

      this.logger.log(
        CheckoutUseCase.name,
        `Order for customer ${request.customerId} placed successfully with ${order.items.length} items and total ${order.total}`,
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
