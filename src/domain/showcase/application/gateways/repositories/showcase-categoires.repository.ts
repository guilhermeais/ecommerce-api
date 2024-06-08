import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Partial } from '@/core/types/deep-partial';
import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';
import { Repository } from '@/core/types/repository';
import { ShowcaseCategory } from '@/domain/showcase/enterprise/entities/showcase-category';

export abstract class ShowcaseCategoriesRepository
  implements Repository<ShowcaseCategory>
{
  abstract list(
    request: PaginatedRequest<
      Partial<{
        name: string;
        categoryId: UniqueEntityID;
      }>
    >,
  ): Promise<PaginatedResponse<ShowcaseCategory>>;
}
