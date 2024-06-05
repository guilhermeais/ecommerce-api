import { Category } from '@/domain/product/enterprise/entities/category';
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

export function mapCategoryToShowcaseCategory(
  category: Category,
  childrenCategories: Category[] = [],
): ShowcaseCategory {
  return ShowcaseCategory.restore(
    {
      name: category.name,
      childrenCategories: childrenCategories.map(
        mapCategoryWithoutFamiliarCategories,
      ),
      description: category.description,
      rootCategory:
        category.rootCategory &&
        mapCategoryWithoutFamiliarCategories(category.rootCategory),
    },
    category.id,
    category.createdAt,
    category.updatedAt,
  );
}

function mapCategoryWithoutFamiliarCategories(
  category: Category,
): ShowcaseCategory {
  return ShowcaseCategory.restore(
    {
      name: category.name,
      description: category.description,
    },
    category.id,
    category.createdAt,
    category.updatedAt,
  );
}
