import {
  Category,
  CategoryProps,
} from '@/domain/product/enterprise/entities/category';
import { faker } from '@faker-js/faker';

export function makeCategory(modifications?: CategoryProps): Category {
  return Category.create({
    name: faker.commerce.department(),
    description: faker.lorem.sentence(),
    rootCategory: undefined,
    ...modifications,
  });
}
