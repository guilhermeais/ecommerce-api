import { EventManager } from '@/core/types/events';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';
import { CategoryFactory } from 'test/products/enterprise/entities/make-category';
import { mapCategoryToShowcaseCategory } from 'test/showcase/enterprise/entities/make-showcase-category';
import { DefaultExceptionFilter } from '../../filters/default-exception-filter.filter';
import { ShowcaseCategoryPresenter } from './presenters/showcase-category-presenter';
import { GetShowcaseCategoriesParams } from './showcase-categories.controller';

export function makeGetShowcaseCategoriesParams(
  modifications?: Partial<GetShowcaseCategoriesParams>,
): GetShowcaseCategoriesParams {
  return {
    limit: 10,
    page: 1,
    ...modifications,
  };
}

describe('GetShowcaseCategoriesController (E2E)', () => {
  let app: INestApplication;
  let eventManager: EventManager;
  let categoryFactory: CategoryFactory;

  beforeAll(async () => {
    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule, CryptographyModule],
      providers: [UserFactory, CategoryFactory, CategoryFactory],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalFilters(new DefaultExceptionFilter());
    eventManager = moduleRef.get(EventManager);
    categoryFactory = moduleRef.get(CategoryFactory);

    await app.init();
  });

  beforeEach(async () => {
    eventManager.clearSubscriptions();
  });

  describe('[GET] /showcase/categories', () => {
    it('should list empty categories', async () => {
      const query = makeGetShowcaseCategoriesParams();

      const response = await request(app.getHttpServer())
        .get('/showcase/categories')
        .query(query);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        total: 0,
        items: [],
        pages: 0,
        currentPage: 1,
        limit: 10,
      });
    });

    it('should paginate the existing categories', async () => {
      const showcaseCategories = await Promise.all(
        Array.from({ length: 15 }).map(async (_, i) =>
          mapCategoryToShowcaseCategory(
            (
              await categoryFactory.makeCategory(
                undefined,
                new Date(2022, 0, i + 1),
              )
            ).category,
          ),
        ),
      );

      const query = makeGetShowcaseCategoriesParams({
        limit: 5,
        page: 1,
      });

      const response = await request(app.getHttpServer())
        .get('/showcase/categories')
        .query(query);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        total: 15,
        pages: 3,
        currentPage: 1,
        limit: 5,
      });

      expect(response.body.items).toHaveLength(5);
      expect(response.body.items).toEqual(
        showcaseCategories.slice(0, 5).map(ShowcaseCategoryPresenter.toHTTP),
      );

      const lastPage = await request(app.getHttpServer())
        .get('/showcase/categories')
        .query({
          ...query,
          page: 3,
        });

      expect(lastPage.status).toBe(200);

      expect(lastPage.body).toMatchObject({
        total: 15,
        pages: 3,
        currentPage: 3,
        limit: 5,
      });

      expect(lastPage.body.items).toHaveLength(5);
    });

    it('should filter a category by name', async () => {
      const categoryToFound = mapCategoryToShowcaseCategory(
        (
          await categoryFactory.makeCategory({
            name: 'aCategory',
          })
        ).category,
      );

      await Promise.all(
        Array.from({ length: 5 }).map(async () =>
          mapCategoryToShowcaseCategory(
            (await categoryFactory.makeCategory()).category,
          ),
        ),
      );

      const query = makeGetShowcaseCategoriesParams({
        limit: 5,
        page: 1,
        name: 'aCategory',
      });

      const response = await request(app.getHttpServer())
        .get('/showcase/categories')
        .query(query);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        total: 1,
        pages: 1,
        currentPage: 1,
        limit: 5,
      });

      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0]).toEqual(
        ShowcaseCategoryPresenter.toHTTP(categoryToFound),
      );
    });
  });
});
