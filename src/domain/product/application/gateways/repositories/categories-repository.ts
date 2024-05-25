import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Repository } from '@/core/types/repository';
import { Category } from '@/domain/product/enterprise/entities/category';

export abstract class CategoriesRepository implements Repository<Category> {
  abstract findById(id: UniqueEntityID): Promise<Category | null>;
  abstract clear(): Promise<void>;
  abstract save(entity: Category): Promise<void>;
}
