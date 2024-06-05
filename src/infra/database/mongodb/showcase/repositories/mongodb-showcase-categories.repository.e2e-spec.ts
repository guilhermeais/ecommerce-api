import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { INestApplication } from '@nestjs/common';
import { makeTestingApp } from 'test/make-testing-app';

import { ShowcaseCategoriesRepository } from '@/domain/showcase/application/gateways/repositories/showcase-categoires.repository';
import { CategoryFactory } from 'test/products/enterprise/entities/make-category';
import { mapCategoryToShowcaseCategory } from 'test/showcase/enterprise/entities/make-showcase-category';
import { MongoDbShowcaseCategoriesRepository } from './mongodb-showcase-categories.repository';

describe('MongoDbShowcaseCategoriesRepository', () => {
  let app: INestApplication;
  let sut: MongoDbShowcaseCategoriesRepository;
  let categoryFactory: CategoryFactory;

  beforeAll(async () => {
    vi.useFakeTimers({
      now: new Date(),
    });

    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule, CryptographyModule],
      providers: [CategoryFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    sut = moduleRef.get(ShowcaseCategoriesRepository);
    categoryFactory = moduleRef.get(CategoryFactory);

    await app.init();
  });

  afterAll(async () => {
    vi.useRealTimers();
    await app.close();
  });

  describe('list()', () => {
    it('should return empty items when has no categories', async () => {
      const response = await sut.list({ page: 1, limit: 10 });

      expect(response.items).toHaveLength(0);
      expect(response.total).toBe(0);
      expect(response.currentPage).toBe(1);
      expect(response.pages).toBe(0);
    });

    it('should list all categories paginated', async () => {
      const showcaseCategories = await Promise.all(
        Array.from({ length: 10 }).map(async (_, i) => {
          const { category } = await categoryFactory.makeCategory(
            undefined,
            new Date(2021, 1, i + 1),
          );

          return mapCategoryToShowcaseCategory(category);
        }),
      );

      const response = await sut.list({ page: 1, limit: 10 });

      expect(response.items).toHaveLength(10);
      expect(response.total).toBe(10);
      expect(response.currentPage).toBe(1);
      expect(response.pages).toBe(1);

      expect(response.items).toEqual(showcaseCategories);

      const secondResponse = await sut.list({ page: 2, limit: 10 });

      expect(secondResponse.items).toHaveLength(0);
    });

    it('should list the category with the category and childrenCategories', async () => {
      const { category } = await categoryFactory.makeCategory();
      const { category: subCategory } = await categoryFactory.makeCategory({
        rootCategory: category,
      });

      const showcaseCategory = mapCategoryToShowcaseCategory(category, [
        subCategory,
      ]);
      const showcaseSubCategory = mapCategoryToShowcaseCategory(subCategory);

      const response = await sut.list({ page: 1, limit: 10 });

      expect(response.items).toHaveLength(1);
      expect(response.total).toBe(1);
      expect(response.currentPage).toBe(1);
      expect(response.pages).toBe(1);
      expect(response.items[0].childrenCategories?.length).toEqual(1);
      expect(response.items[0]).toEqual(showcaseCategory);
      expect(response.items[0].childrenCategories?.[0].id).toEqual(
        showcaseSubCategory.id,
      );
    });
  });
});
