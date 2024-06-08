import { OrdersRepository } from '@/domain/showcase/application/gateways/repositories/orders-repository';
import { Order } from '@/domain/showcase/enterprise/entities/order';

export class InMemoryOrdersRepository implements OrdersRepository {
  readonly orders: Order[] = [];

  async save(entity: Order): Promise<void> {
    const index = this.orders.findIndex((t) => t.id.equals(entity.id));

    if (index === -1) {
      this.orders.push(entity);
    } else {
      this.orders[index] = entity;
    }
  }
}
