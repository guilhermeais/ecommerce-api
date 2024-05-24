import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Repository } from '@/core/types/repository';
import { Product } from '@/domain/product/enterprise/entities/product';

export abstract class ProductsRepository implements Repository<Product> {
  abstract save(entity: Product): Promise<void>;

  abstract findById(id: UniqueEntityID): Promise<Product | null>;

  abstract clear(): Promise<void>;
}
