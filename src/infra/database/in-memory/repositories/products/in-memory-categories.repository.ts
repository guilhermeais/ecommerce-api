import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { CategoriesRepository } from '@/domain/product/application/gateways/repositories/categories-repository';
import { Category } from '@/domain/product/enterprise/entities/category';

export class InMemoryCategoriesRepository implements CategoriesRepository {
  private readonly categories: Category[] = [];

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
}
