import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { OrdersRepository } from '@/domain/showcase/application/gateways/repositories/orders-repository';
import { Order } from '@/domain/showcase/enterprise/entities/order';

export class InMemoryOrdersRepository implements OrdersRepository {
  async findById(id: UniqueEntityID): Promise<Order | null> {
    return this.orders.find((t) => t.id.equals(id)) ?? null;
  }
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
