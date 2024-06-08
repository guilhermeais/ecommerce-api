import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';
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

  async list(
    request: PaginatedRequest<Partial<{ customerId: UniqueEntityID }>>,
  ): Promise<PaginatedResponse<Order>> {
    const page = request.page - 1;
    const start = page * request.limit;
    const end = start + request.limit;
    const { customerId } = request;

    const orders = this.orders.filter((order) => {
      if (customerId && !order?.customer?.id.equals(customerId)) {
        return false;
      }

      return true;
    });
    const items = orders.slice(start, end);
    const pages = Math.ceil(orders.length / request.limit);

    return {
      items,
      total: this.orders.length,
      pages,
      limit: request.limit,
      currentPage: request.page,
    };
  }
}
