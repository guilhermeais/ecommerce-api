import {
  ShowCaseProductProps,
  ShowcaseProduct,
} from '@/domain/showcase/enterprise/entities/showcase-product';
import { faker } from '@faker-js/faker';

export function makeShowcaseProduct(
  modifications?: Partial<ShowCaseProductProps>,
  createdAt?: Date,
  updatedAt?: Date,
): ShowcaseProduct {
  return ShowcaseProduct.create(
    {
      name: faker.commerce.productName(),
      price: Number(faker.commerce.price()),
      ...modifications,
    },
    createdAt,
    updatedAt,
  );
}
