import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';
import { ProductsRepository } from '@/domain/product/application/gateways/repositories/products-repository';
import { Product } from '@/domain/product/enterprise/entities/product';

export class InMemoryProductsRepository implements ProductsRepository {
  async list(
    request: PaginatedRequest<{
      name: string;
      categoryId: UniqueEntityID;
      subCategoryId: UniqueEntityID;
    }>,
  ): Promise<PaginatedResponse<Product>> {
    const page = request.page - 1;
    const start = page * request.limit;
    const end = start + request.limit;
    const { categoryId, name, subCategoryId } = request;

    const products = this.products.filter((product) => {
      if (subCategoryId && !product.subCategory?.id?.equals(subCategoryId)) {
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
  private readonly products: Product[] = [];
  async clear(): Promise<void> {
    this.products.length = 0;
  }

  async save(products: Product): Promise<void> {
    const index = this.products.findIndex((t) => t.id.equals(products.id));

    if (index === -1) {
      this.products.push(products);
    } else {
      this.products[index] = products;
    }
  }

  async findById(id: UniqueEntityID): Promise<Product | null> {
    const found = this.products.find((t) => t.id.equals(id));

    return found || null;
  }
}
