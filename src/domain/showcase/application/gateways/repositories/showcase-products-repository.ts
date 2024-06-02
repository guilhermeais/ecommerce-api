import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { PaginatedResponse } from '@/core/types/pagination';
import { Repository } from '@/core/types/repository';
import { ShowcaseProduct } from '@/domain/showcase/enterprise/entities/showcase-product';

export abstract class ShowcaseProductRepository
  implements Repository<ShowcaseProduct>
{
  abstract findById(id: UniqueEntityID): Promise<ShowcaseProduct | null>;
  abstract list(request: {
    page: number;
    limit: number;
  }): Promise<PaginatedResponse<ShowcaseProduct>>;
}
