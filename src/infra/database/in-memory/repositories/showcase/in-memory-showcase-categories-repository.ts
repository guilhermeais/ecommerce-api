import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';
import { ShowcaseCategoriesRepository } from '@/domain/showcase/application/gateways/repositories/showcase-categoires.repository';
import { ShowcaseCategory } from '@/domain/showcase/enterprise/entities/showcase-category';

export class InMemoryShowcaseCategoriesRepository
  implements ShowcaseCategoriesRepository
{
  readonly categories: ShowcaseCategory[] = [];

  async list(
    request: PaginatedRequest<
      Partial<{
        name: string;
        categoryId: UniqueEntityID;
      }>
    >,
  ): Promise<PaginatedResponse<ShowcaseCategory>> {
    const page = request.page - 1;
    const start = page * request.limit;
    const end = start + request.limit;
    const { categoryId, name } = request;

    const categories = this.categories.filter((category) => {
      if (categoryId && !category?.id?.equals(categoryId)) {
        return false;
      }

      if (name && !category.name.includes(name)) {
        return false;
      }

      return true;
    });
    const items = categories.slice(start, end);
    const pages = Math.ceil(categories.length / request.limit);

    return {
      items,
      total: this.categories.length,
      pages,
      limit: request.limit,
      currentPage: request.page,
    };
  }
}
