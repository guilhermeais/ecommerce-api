import { EventManager } from '@/core/types/events';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';
import { CategoryFactory } from 'test/products/enterprise/entities/make-category';
import { ProductFactory } from 'test/products/enterprise/entities/make-product';
import { mapProductToShowcaseProduct } from 'test/showcase/enterprise/entities/make-showcase-product';
import { DefaultExceptionFilter } from '../../filters/default-exception-filter.filter';
import { GetShowcaseProductsParams } from './get-showcase-products.controller';
import {
  ShowcaseProductHTTPResponse,
  ShowcaseProductPresenter,
} from './presenters/showcase-product-presenter';

export function makeGetShowcaseProductsParams(
  modifications?: Partial<GetShowcaseProductsParams>,
): GetShowcaseProductsParams {
  return {
    limit: 10,
    page: 1,
    ...modifications,
  };
}

describe('GetShowcaseProductsController (E2E)', () => {
  let app: INestApplication;
  let eventManager: EventManager;
  let productFactory: ProductFactory;
  let categoryFactory: CategoryFactory;

  beforeAll(async () => {
    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule, CryptographyModule],
      providers: [UserFactory, ProductFactory, CategoryFactory],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalFilters(new DefaultExceptionFilter());
    eventManager = moduleRef.get(EventManager);
    productFactory = moduleRef.get(ProductFactory);
    categoryFactory = moduleRef.get(CategoryFactory);

    await app.init();
  });

  beforeEach(async () => {
    eventManager.clearSubscriptions();
  });

  describe('[GET] /showcase/products', () => {
    it('should list empty products', async () => {
      const query = makeGetShowcaseProductsParams();

      const response = await request(app.getHttpServer())
        .get('/showcase/products')
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
      const showcaseProducts = await Promise.all(
        Array.from({ length: 15 }).map(async (_, i) =>
          mapProductToShowcaseProduct(
            await productFactory.makeProduct(
              {
                isShown: true,
              },
              new Date(2022, 0, i + 1),
            ),
          ),
        ),
      );

      const query = makeGetShowcaseProductsParams({
        limit: 5,
        page: 1,
      });

      const response = await request(app.getHttpServer())
        .get('/showcase/products')
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
        showcaseProducts.slice(0, 5).map(ShowcaseProductPresenter.toHTTP),
      );

      const lastPage = await request(app.getHttpServer())
        .get('/showcase/products')
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
      const { category } = await categoryFactory.makeCategory();
      const { category: subCategory } = await categoryFactory.makeCategory({
        rootCategory: category,
      });
      const categoryId = category.id.toString();

      const productToFound = mapProductToShowcaseProduct(
        await productFactory.makeProduct({
          isShown: true,
          subCategory,
        }),
      );

      await Promise.all(
        Array.from({ length: 5 }).map(() => productFactory.makeProduct()),
      );

      const query = makeGetShowcaseProductsParams({
        categoryId,
      });

      const response = await request(app.getHttpServer())
        .get('/showcase/products')
        .query(query);

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(1);
      const product = response.body.items[0] as ShowcaseProductHTTPResponse;
      expect(product.id).toBe(productToFound.id.toString());
      expect(product.category?.id).toBe(subCategory.id.toString());
      expect(product.category?.name).toBe(subCategory.name);
      expect(product.category?.description).toBe(subCategory.description);
      expect(product.category?.rootCategory!.id).toBe(category.id.toString());
      expect(product.category?.rootCategory!.name).toBe(category.name);
      expect(product.category?.rootCategory!.description).toBe(
        category.description,
      );
    });

    it('should filter by subCategoryId', async () => {
      const { category } = await categoryFactory.makeCategory();
      const { category: subCategory } = await categoryFactory.makeCategory({
        rootCategory: category,
      });
      const subCategoryId = subCategory.id.toString();

      const productToFound = mapProductToShowcaseProduct(
        await productFactory.makeProduct({
          subCategory,
          isShown: true,
        }),
      );

      await Promise.all(
        Array.from({ length: 5 }).map(() => productFactory.makeProduct()),
      );

      const query = makeGetShowcaseProductsParams({
        subCategoryId,
      });

      const response = await request(app.getHttpServer())
        .get('/showcase/products')
        .query(query);

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].id).toBe(productToFound.id.toString());
    });

    it.each([
      {
        query: makeGetShowcaseProductsParams({
          name: 'product',
        }),
        async mock() {
          const showcaseProducts = (
            await Promise.all([
              productFactory.makeProduct(
                {
                  name: 'product',
                  isShown: true,
                },
                new Date(2022, 0, 1),
              ),
              productFactory.makeProduct(
                {
                  name: 'Product',
                  isShown: true,
                },
                new Date(2022, 0, 2),
              ),
              productFactory.makeProduct(
                {
                  name: 'PRODUCT',
                  isShown: true,
                },
                new Date(2022, 0, 3),
              ),
            ])
          )
            .map(mapProductToShowcaseProduct)
            .map(ShowcaseProductPresenter.toHTTP);

          return {
            expected: showcaseProducts,
          };
        },
      },
    ] as {
      query: GetShowcaseProductsParams;
      mock: () => Promise<{
        expected: ShowcaseProductHTTPResponse[];
        statusCode?: number;
      }>;
    }[])(
      `[%#] should filter products using $query`,
      async ({ mock, query }) => {
        const { expected, statusCode } = await mock();

        const response = await request(app.getHttpServer())
          .get('/showcase/products')
          .query(query);

        expect(response.status).toBe(statusCode || 200);
        expect(response.body.items).toHaveLength(expected.length);
        expect(response.body.items).toEqual(expected);
      },
    );
  });
});
