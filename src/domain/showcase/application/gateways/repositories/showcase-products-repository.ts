import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Partial } from '@/core/types/deep-partial';
import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';
import { Repository } from '@/core/types/repository';
import { ShowcaseProduct } from '@/domain/showcase/enterprise/entities/showcase-product';

export abstract class ShowcaseProductsRepository
  implements Repository<ShowcaseProduct>
{
  abstract findById(id: UniqueEntityID): Promise<ShowcaseProduct | null>;
  abstract list(
    request: PaginatedRequest<
      Partial<{
        name: string;
        categoryId: UniqueEntityID;
        subCategoryId: UniqueEntityID;
      }>
    >,
  ): Promise<PaginatedResponse<ShowcaseProduct>>;
}
