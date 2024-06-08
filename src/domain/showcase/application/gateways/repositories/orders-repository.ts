import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Repository } from '@/core/types/repository';
import { Order } from '@/domain/showcase/enterprise/entities/order';

export abstract class OrdersRepository implements Repository<Order> {
  abstract save(entity: Order): Promise<void>;
  abstract findById(id: UniqueEntityID): Promise<Order | null>;
}
