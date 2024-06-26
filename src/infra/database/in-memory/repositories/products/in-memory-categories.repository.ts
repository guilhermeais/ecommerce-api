import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';
import { CategoriesRepository } from '@/domain/product/application/gateways/repositories/categories-repository';
import { Category } from '@/domain/product/enterprise/entities/category';

export class InMemoryCategoriesRepository implements CategoriesRepository {
  private readonly categories: Category[] = [];

  async list(
    request: PaginatedRequest<
      Partial<{ name: string; rootCategoryId: UniqueEntityID }>
    >,
  ): Promise<PaginatedResponse<Category>> {
    const page = request.page - 1;
    const start = page * request.limit;
    const end = start + request.limit;
    const { name, rootCategoryId } = request;

    const categories = this.categories.filter((category) => {
      if (
        rootCategoryId &&
        !category.rootCategory?.id?.equals(rootCategoryId)
      ) {
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
      total: categories.length,
      pages,
      limit: request.limit,
      currentPage: request.page,
    };
  }

  async clear(): Promise<void> {
    this.categories.length = 0;
  }

  async save(products: Category): Promise<void> {
    const index = this.categories.findIndex((t) => t.id.equals(products.id));

    if (index === -1) {
      this.categories.push(products);
    } else {
      this.categories[index] = products;
    }
  }

  async findById(id: UniqueEntityID): Promise<Category | null> {
    const found = this.categories.find((t) => t.id.equals(id));

    return found || null;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.categories.findIndex((t) => t.id.equals(id));

    if (index !== -1) {
      this.categories.splice(index, 1);
    }
  }

  async exists(id: UniqueEntityID): Promise<boolean> {
    return this.categories.some((t) => t.id.equals(id));
  }
}
