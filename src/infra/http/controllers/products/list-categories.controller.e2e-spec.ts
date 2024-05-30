import { EventManager } from '@/core/types/events';
import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { CategoriesRepository } from '@/domain/product/application/gateways/repositories/categories-repository';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';
import { CategoryFactory } from 'test/products/enterprise/entities/make-category';
import { DefaultExceptionFilter } from '../../filters/default-exception-filter.filter';
import { ListCategoriesParams } from './list-categories.controller';
import { CategoryPresenter } from './presenters/category-presenter';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { faker } from '@faker-js/faker';

export function makeListCategoriesParams(
  modifications?: Partial<ListCategoriesParams>,
): ListCategoriesParams {
  return {
    limit: 10,
    page: 1,
    ...modifications,
  };
}

describe('ListSignUpInvitesController (E2E)', () => {
  let app: INestApplication;
  let categoriesRepository: CategoriesRepository;
  let eventManager: EventManager;
  let userFactory: UserFactory;
  let categoryFactory: CategoryFactory;

  beforeAll(async () => {
    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule, CryptographyModule],
      providers: [UserFactory, CategoryFactory],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalFilters(new DefaultExceptionFilter());

    categoriesRepository = moduleRef.get(CategoriesRepository);
    eventManager = moduleRef.get(EventManager);
    userFactory = moduleRef.get(UserFactory);
    categoryFactory = moduleRef.get(CategoryFactory);

    await app.init();
  });

  beforeEach(async () => {
    eventManager.clearSubscriptions();
    await categoriesRepository.clear();
  });

  describe('[GET] /admin/categories', () => {
    it('should list empty categories', async () => {
      const { accessToken } = await userFactory.makeUser({
        role: Role.ADMIN,
      });

      const query = makeListCategoriesParams();

      const response = await request(app.getHttpServer())
        .get('/admin/categories')
        .set('Authorization', `Bearer ${accessToken}`)
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
      const { accessToken } = await userFactory.makeUser({
        role: Role.MASTER,
      });

      const categories = await Promise.all(
        Array.from({ length: 15 }).map(
          async (_, i) =>
            (
              await categoryFactory.makeCategory(
                undefined,
                new Date(2021, 1, i + 1),
              )
            ).category,
        ),
      );

      const query = makeListCategoriesParams({
        limit: 5,
        page: 1,
      });

      const response = await request(app.getHttpServer())
        .get('/admin/categories')
        .set('Authorization', `Bearer ${accessToken}`)
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
        categories.slice(0, 5).map(CategoryPresenter.toHTTP),
      );

      const lastPage = await request(app.getHttpServer())
        .get('/admin/categories')
        .set('Authorization', `Bearer ${accessToken}`)
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

    it('should filter by name', async () => {
      const { accessToken } = await userFactory.makeUser({
        role: Role.MASTER,
      });

      const name = 'Category To Found';
      const { category } = await categoryFactory.makeCategory({
        name,
      });

      await Promise.all(
        Array.from({ length: 5 }).map(() => categoryFactory.makeCategory()),
      );

      const query = makeListCategoriesParams({
        name,
      });

      const response = await request(app.getHttpServer())
        .get('/admin/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .query(query);

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0]).toEqual(
        CategoryPresenter.toHTTP(category),
      );
    });
  });

  describe('[GET] /admin/categories/:rootCategoryId/sub-category', () => {
    it('should return EntityNotFoundError if the root category does not exists', async () => {
      const { accessToken } = await userFactory.makeUser({
        role: Role.MASTER,
      });

      const query = makeListCategoriesParams();
      const rootCategoryId = faker.string.uuid();

      const response = await request(app.getHttpServer())
        .get(`/admin/categories/${rootCategoryId}/sub-category`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query(query);

      const error = new EntityNotFoundError('Categoria Pai', rootCategoryId);
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        statusCode: error.code,
        message: [error.message],
        details: error.details,
      });
    });

    it('should list all sub categories of an category', async () => {
      const { accessToken } = await userFactory.makeUser({
        role: Role.MASTER,
      });

      const { category: rootCategory } = await categoryFactory.makeCategory({
        rootCategory: undefined,
      });

      const subCategories = await Promise.all(
        Array.from({ length: 15 }).map(
          async (_, i) =>
            (
              await categoryFactory.makeCategory(
                { rootCategory: rootCategory },
                new Date(2021, 1, i + 1),
              )
            ).category,
        ),
      );

      const query = makeListCategoriesParams({
        limit: 5,
        page: 1,
      });

      const response = await request(app.getHttpServer())
        .get(`/admin/categories/${rootCategory.id.toString()}/sub-category`)
        .set('Authorization', `Bearer ${accessToken}`)
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
        subCategories.slice(0, 5).map(CategoryPresenter.toHTTP),
      );

      const lastPage = await request(app.getHttpServer())
        .get(`/admin/categories/${rootCategory.id.toString()}/sub-category`)
        .set('Authorization', `Bearer ${accessToken}`)
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
  });
});
