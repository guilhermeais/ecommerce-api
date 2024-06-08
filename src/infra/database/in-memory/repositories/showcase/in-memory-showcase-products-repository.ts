import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';
import { ShowcaseProductsRepository } from '@/domain/showcase/application/gateways/repositories/showcase-products-repository';
import { ShowcaseProduct } from '@/domain/showcase/enterprise/entities/showcase-product';

export class InMemoryShowcaseProductRepository
  implements ShowcaseProductsRepository
{
  async list(
    request: PaginatedRequest<{
      name: string;
      categoryId: UniqueEntityID;
      subCategoryId: UniqueEntityID;
    }>,
  ): Promise<PaginatedResponse<ShowcaseProduct>> {
    const page = request.page - 1;
    const start = page * request.limit;
    const end = start + request.limit;
    const { categoryId, name, subCategoryId } = request;

    const products = this.products.filter((product) => {
      if (
        subCategoryId &&
        !product.category?.rootCategory?.id.equals(subCategoryId)
      ) {
        return false;
      }

      if (categoryId && !product.category?.id?.equals(categoryId)) {
        return false;
      }

      if (name && !product.name.includes(name)) {
        return false;
      }

      return true;
    });
    const items = products.slice(start, end);
    const pages = Math.ceil(products.length / request.limit);

    return {
      items,
      total: this.products.length,
      pages,
      limit: request.limit,
      currentPage: request.page,
    };
  }
  readonly products: ShowcaseProduct[] = [];

  async clear(): Promise<void> {
    this.products.length = 0;
  }

  async findById(id: UniqueEntityID): Promise<ShowcaseProduct | null> {
    const found = this.products.find((t) => t.id.equals(id));

    return found || null;
  }
}
