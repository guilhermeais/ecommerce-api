import { EventManager } from '@/core/types/events';
import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { ProductsRepository } from '@/domain/product/application/gateways/repositories/products-repository';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';
import { CategoryFactory } from 'test/products/enterprise/entities/make-category';
import { ProductFactory } from 'test/products/enterprise/entities/make-product';
import { DefaultExceptionFilter } from '../../filters/default-exception-filter.filter';
import { ListProductsParams } from './list-products.controller';

export function makeListProductsParams(
  modifications?: Partial<ListProductsParams>,
): ListProductsParams {
  return {
    limit: 10,
    page: 1,
    ...modifications,
  };
}

describe('ListSignUpInvitesController (E2E)', () => {
  let app: INestApplication;
  let productsRepository: ProductsRepository;
  let eventManager: EventManager;
  let userFactory: UserFactory;
  let productFactory: ProductFactory;
  let categoryFactory: CategoryFactory;

  beforeAll(async () => {
    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule, CryptographyModule],
      providers: [UserFactory, ProductFactory, CategoryFactory],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalFilters(new DefaultExceptionFilter());

    productsRepository = moduleRef.get(ProductsRepository);
    eventManager = moduleRef.get(EventManager);
    userFactory = moduleRef.get(UserFactory);
    productFactory = moduleRef.get(ProductFactory);
    categoryFactory = moduleRef.get(CategoryFactory);

    await app.init();
  });

  beforeEach(async () => {
    eventManager.clearSubscriptions();
    await productsRepository.clear();
  });

  describe('[GET] /admin/products', () => {
    it('should list empty products', async () => {
      const { accessToken } = await userFactory.makeUser({
        role: Role.ADMIN,
      });

      const query = makeListProductsParams();

      const response = await request(app.getHttpServer())
        .get('/admin/products')
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

    it('should paginate the existing products', async () => {
      const { accessToken } = await userFactory.makeUser({
        role: Role.MASTER,
      });

      await Promise.all(
        Array.from({ length: 15 }).map(() => productFactory.makeProduct()),
      );

      const query = makeListProductsParams({
        limit: 5,
        page: 1,
      });

      const response = await request(app.getHttpServer())
        .get('/admin/products')
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

      const lastPage = await request(app.getHttpServer())
        .get('/admin/products')
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

    it('should filter by categoryId', async () => {
      const { accessToken } = await userFactory.makeUser({
        role: Role.MASTER,
      });
      const { category } = await categoryFactory.makeCategory();
      const { category: subCategory } = await categoryFactory.makeCategory({
        rootCategory: category,
      });
      const categoryId = category.id.toString();

      const productToFound = await productFactory.makeProduct({
        subCategory,
      });

      await Promise.all(
        Array.from({ length: 5 }).map(() => productFactory.makeProduct()),
      );

      const query = makeListProductsParams({
        categoryId,
      });

      const response = await request(app.getHttpServer())
        .get('/admin/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .query(query);

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].id).toBe(productToFound.id.toString());
    });

    it('should filter by subCategoryId', async () => {
      const { accessToken } = await userFactory.makeUser({
        role: Role.MASTER,
      });
      const { category } = await categoryFactory.makeCategory();
      const { category: subCategory } = await categoryFactory.makeCategory({
        rootCategory: category,
      });
      const subCategoryId = subCategory.id.toString();

      const productToFound = await productFactory.makeProduct({
        subCategory,
      });

      await Promise.all(
        Array.from({ length: 5 }).map(() => productFactory.makeProduct()),
      );

      const query = makeListProductsParams({
        subCategoryId,
      });

      const response = await request(app.getHttpServer())
        .get('/admin/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .query(query);

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].id).toBe(productToFound.id.toString());
    });
  });
});
