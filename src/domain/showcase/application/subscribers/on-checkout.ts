import { EventManager, Events } from '@/core/types/events';
import { Logger } from '@/shared/logger';
import { Injectable } from '@nestjs/common';
import { Order } from '../../enterprise/entities/order';
import { PubSubGateway } from '../gateways/gateways/pub-sub-gateway';
import { EnvService } from '@/infra/env/env.service';

@Injectable()
export class OnCheckout {
  constructor(
    private readonly pubSubGateway: PubSubGateway,
    private readonly logger: Logger,
    private readonly events: EventManager,
    private readonly env: EnvService,
  ) {
    this.logger.log(OnCheckout.name, 'subscribing to checkout event');
    this.events.subscribe(Events.ORDER_CREATED, (...args) =>
      this.handle(...args),
    );

    this.logger.log(OnCheckout.name, `Subscribed to checkout event.`);
  }

  async handle(order: Order): Promise<void> {
    try {
      this.logger.log(
        OnCheckout.name,
        `Order ${order.id.toString()} created for customer ${order.customer.id.toString()}`,
      );

      await this.pubSubGateway.publish(
        this.env.get('GOOGLE_PUB_SUB_CHECKOUT_TOPIC'),
        this.mapOrderToPubSub(order),
      );
    } catch (error: any) {
      this.logger.error(
        OnCheckout.name,
        `Error publishing order ${order.id.toString()} created event: ${error.message}`,
        error.stack,
      );
    }
  }

  private mapOrderToPubSub(order: Order) {
    return {
      id: order.id.toString(),
      customer: {
        id: order.customer.id.toString(),
        name: order.customer.name,
        email: order.customer.email,
        createdAt: order.customer.createdAt,
        updatedAt: order.customer.updatedAt,
      },
      items: order.items.map((item) => ({
        product: {
          id: item.product.id.toString(),
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
          description: item.product.description,
          category: item.product.category && {
            id: item.product.category.id.toString(),
            name: item.product.category.name,
            description: item.product.category.description,
            rootCategory: item.product.category?.rootCategory && {
              id: item.product.category.rootCategory.id.toString(),
              name: item.product.category.rootCategory.name,
              description: item.product.category.rootCategory.description,
              createdAt: item.product.category.rootCategory.createdAt,
              updatedAt: item.product.category.rootCategory.updatedAt,
            },
            createdAt: item.product.category.createdAt,
            updatedAt: item.product.category.updatedAt,
          },
          createdAt: item.product.createdAt,
          updatedAt: item.product.updatedAt,
        },
        quantity: item.quantity,
        total: item.total,
      })),
      deliveryAddress: order.deliveryAddress.toObject(),
      paymentMethod: order.paymentMethod.toObject(),
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
