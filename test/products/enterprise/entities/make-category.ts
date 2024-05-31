import { CategoriesRepository } from '@/domain/product/application/gateways/repositories/categories-repository';
import {
  Category,
  CategoryProps,
} from '@/domain/product/enterprise/entities/category';
import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';

export function makeCategory(
  modifications?: Partial<CategoryProps>,
  createdAt?: Date,
): Category {
  return Category.create(
    {
      name: faker.commerce.department(),
      description: faker.lorem.sentence(),
      rootCategory: undefined,
      ...modifications,
    },
    createdAt,
  );
}

@Injectable()
export class CategoryFactory {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async makeCategory(
    modifications?: Partial<CategoryProps>,
    createdAt = new Date(),
  ): Promise<{ category: Category }> {
    const category = makeCategory(modifications, createdAt);

    await this.categoriesRepository.save(category);

    return { category };
  }
}
