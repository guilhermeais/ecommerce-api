import { ShowcaseCategory } from '@/domain/showcase/enterprise/entities/showcase-category';
import { faker } from '@faker-js/faker';

export function makeShowcaseCategory(
  modifications?: Partial<ShowcaseCategory>,
): ShowcaseCategory {
  return ShowcaseCategory.create({
    name: faker.commerce.department(),
    childrenCategories: [],
    description: faker.commerce.productDescription(),
    ...modifications,
  });
}
