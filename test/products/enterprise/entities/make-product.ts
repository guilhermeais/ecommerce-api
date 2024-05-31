import { ProductsRepository } from '@/domain/product/application/gateways/repositories/products-repository';
import { Administrator } from '@/domain/product/enterprise/entities/administrator';
import {
  Product,
  ProductProps,
} from '@/domain/product/enterprise/entities/product';
import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { CategoryFactory, makeCategory } from './make-category';
import { Email } from '@/domain/auth/enterprise/entities/value-objects/email';

export function makeProduct(
  modifications?: Partial<ProductProps>,
  createdAt?: Date,
): Product {
  return Product.create(
    {
      name: faker.commerce.productName(),
      price: Number(faker.commerce.price()),
      description: faker.lorem.sentence(),
      image: faker.image.url(),
      isShown: false,
      createdBy: Administrator.create({
        email: faker.internet.email(),
        name: faker.person.fullName(),
      }),
      subCategory: makeCategory(),
      updatedBy: null,
      ...modifications,
    },
    createdAt,
  );
}

@Injectable()
export class ProductFactory {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoryFactory: CategoryFactory,
    private readonly userFactory: UserFactory,
  ) {}

  async makeProduct(
    modifications?: Partial<ProductProps>,
    createdAt?: Date,
  ): Promise<Product> {
    const createdBy =
      modifications?.createdBy ||
      Administrator.create({
        email: faker.internet.email(),
        name: faker.person.fullName(),
      });

    await this.userFactory.makeUser({
      email: Email.restore(createdBy!.email),
      name: createdBy.name,
      id: createdBy.id,
    });

    const category =
      modifications?.subCategory ??
      (await this.categoryFactory.makeCategory()).category;

    const product = makeProduct(
      {
        subCategory: category,
        ...modifications,
        createdBy,
      },
      createdAt,
    );

    await this.productsRepository.save(product);

    return product;
  }
}
