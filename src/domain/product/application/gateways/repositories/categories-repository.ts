import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Partial } from '@/core/types/deep-partial';
import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';
import { Repository } from '@/core/types/repository';
import { Category } from '@/domain/product/enterprise/entities/category';

export abstract class CategoriesRepository implements Repository<Category> {
  abstract findById(id: UniqueEntityID): Promise<Category | null>;
  abstract clear(): Promise<void>;
  abstract save(entity: Category): Promise<void>;
  abstract list(
    request: PaginatedRequest<
      Partial<{
        name: string;
        rootCategoryId: UniqueEntityID;
      }>
    >,
  ): Promise<PaginatedResponse<Category>>;
}
