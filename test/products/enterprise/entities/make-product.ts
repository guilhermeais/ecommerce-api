import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { CreatedBy } from '@/domain/product/enterprise/entities/created-by';
import {
  Product,
  ProductProps,
} from '@/domain/product/enterprise/entities/product';
import { faker } from '@faker-js/faker';
import { makeCategory } from './make-category';

export function makeProduct(modifications?: Partial<ProductProps>): Product {
  return Product.create({
    name: faker.commerce.productName(),
    price: Number(faker.commerce.price()),
    description: faker.lorem.sentence(),
    image: faker.image.url(),
    isShown: false,
    createdBy: CreatedBy.create({
      email: faker.internet.email(),
      name: faker.person.fullName(),
      id: new UniqueEntityID(),
    }),
    subCategory: makeCategory(),
    updatedBy: null,
    ...modifications,
  });
}
