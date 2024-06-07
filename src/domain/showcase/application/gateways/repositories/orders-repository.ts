import { Repository } from '@/core/types/repository';
import { Order } from '@/domain/showcase/enterprise/entities/order';

export abstract class OrdersRepository implements Repository<Order> {
  abstract save(entity: Order): Promise<void>;
}
