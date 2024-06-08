import { Product } from '@/domain/product/enterprise/entities/product';
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
    undefined,
    createdAt,
    updatedAt,
  );
}
export function mapProductToShowcaseProduct(product: Product): ShowcaseProduct {
  return ShowcaseProduct.restore(
    {
      name: product.name,
      price: product.price,
      category: product?.subCategory
        ? {
            id: product.subCategory.id,
            name: product.subCategory.name,
            description: product.subCategory.description,
            rootCategory: product.subCategory.rootCategory && {
              id: product.subCategory.rootCategory.id,
              name: product.subCategory.rootCategory.name,
              description: product.subCategory.rootCategory.description,
              createdAt: product.subCategory.rootCategory.createdAt,
              updatedAt: product.subCategory.rootCategory.updatedAt,
            },
            createdAt: product.subCategory.createdAt,
            updatedAt: product.subCategory.updatedAt,
          }
        : undefined,
      description: product.description,
      image: product.image,
    },
    product.id,
    product.createdAt,
    product.updatedAt,
  );
}
