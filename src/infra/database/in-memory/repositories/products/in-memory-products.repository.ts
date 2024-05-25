import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { ProductsRepository } from '@/domain/product/application/gateways/repositories/products-repository';
import { Product } from '@/domain/product/enterprise/entities/product';

export class InMemoryProductsRepository implements ProductsRepository {
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
