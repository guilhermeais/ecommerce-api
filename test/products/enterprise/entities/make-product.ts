import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { ProductsRepository } from '@/domain/product/application/gateways/repositories/products-repository';
import { Administrator } from '@/domain/product/enterprise/entities/administrator';
import {
  Product,
  ProductProps,
} from '@/domain/product/enterprise/entities/product';
import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { CategoryFactory, makeCategory } from './make-category';

export function makeProduct(modifications?: Partial<ProductProps>): Product {
  return Product.create({
    name: faker.commerce.productName(),
    price: Number(faker.commerce.price()),
    description: faker.lorem.sentence(),
    image: faker.image.url(),
    isShown: false,
    createdBy: Administrator.create({
      email: faker.internet.email(),
      name: faker.person.fullName(),
      id: new UniqueEntityID(),
    }),
    subCategory: makeCategory(),
    updatedBy: null,
    ...modifications,
  });
}

@Injectable()
export class ProductFactory {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoryFactory: CategoryFactory,
  ) {}

  async makeProduct(modifications?: Partial<ProductProps>): Promise<Product> {
    const category =
      modifications?.subCategory ??
      (await this.categoryFactory.makeCategory()).category;

    const product = makeProduct({
      subCategory: category,
      ...modifications,
    });

    await this.productsRepository.save(product);

    return product;
  }
}
