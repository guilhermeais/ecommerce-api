import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { INestApplication } from '@nestjs/common';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';

import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { ShowcaseProductsRepository } from '@/domain/showcase/application/gateways/repositories/showcase-products-repository';
import { CategoryFactory } from 'test/products/enterprise/entities/make-category';
import { ProductFactory } from 'test/products/enterprise/entities/make-product';
import { MongoDbShowcaseProductsRepository } from './mongodb-showcase-products.repository';
import { mapProductToShowcaseProduct } from 'test/showcase/enterprise/entities/make-showcase-product';

describe('MongoDbShowcaseProductsRepository', () => {
  let app: INestApplication;
  let sut: MongoDbShowcaseProductsRepository;
  let productFactory: ProductFactory;
  let categoryFactory: CategoryFactory;

  beforeAll(async () => {
    vi.useFakeTimers({
      now: new Date(),
    });

    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule, CryptographyModule],
      providers: [UserFactory, CategoryFactory, ProductFactory, UserFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    sut = moduleRef.get(ShowcaseProductsRepository);
    productFactory = moduleRef.get(ProductFactory);
    categoryFactory = moduleRef.get(CategoryFactory);

    await app.init();
  });

  afterAll(async () => {
    vi.useRealTimers();
    await app.close();
  });

  describe('findById()', () => {
    it('should return null if the showcase product does not exists', async () => {
      const product = await sut.findById(new UniqueEntityID());

      expect(product).toBeNull();
    });

    it('should return null when searching for a product that is not displayed', async () => {
      const { id } = await productFactory.makeProduct({
        isShown: false,
      });

      const product = await sut.findById(id);

      expect(product).toBeNull();
    });
    it('should find a showcase product by id', async () => {
      const product = await productFactory.makeProduct({
        isShown: true,
      });
      const foundProduct = await sut.findById(product.id);
      const expectedShowcaseProduct = mapProductToShowcaseProduct(product);

      expect(foundProduct).toEqual(expectedShowcaseProduct);
    });
  });

  describe('list()', () => {
    it('should return empty items when has no products', async () => {
      const response = await sut.list({ page: 1, limit: 10 });

      expect(response.items).toHaveLength(0);
      expect(response.total).toBe(0);
      expect(response.currentPage).toBe(1);
      expect(response.pages).toBe(0);
    });

    it('should list all products paginated', async () => {
      const showcaseProducts = await Promise.all(
        Array.from({ length: 10 }).map(async (_, i) => {
          const product = await productFactory.makeProduct(
            {
              isShown: true,
            },
            new Date(2021, 1, i + 1),
          );

          return mapProductToShowcaseProduct(product);
        }),
      );

      const response = await sut.list({ page: 1, limit: 10 });

      expect(response.items).toHaveLength(10);
      expect(response.total).toBe(10);
      expect(response.currentPage).toBe(1);
      expect(response.pages).toBe(1);

      expect(response.items).toEqual(showcaseProducts);

      const secondResponse = await sut.list({ page: 2, limit: 10 });

      expect(secondResponse.items).toHaveLength(0);
    });

    it('should list the product with the category and subCategory', async () => {
      const { category } = await categoryFactory.makeCategory();
      const { category: subCategory } = await categoryFactory.makeCategory({
        rootCategory: category,
      });

      const showcaseProduct = mapProductToShowcaseProduct(
        await productFactory.makeProduct({
          subCategory: subCategory,
          isShown: true,
        }),
      );

      const response = await sut.list({ page: 1, limit: 10 });

      expect(response.items).toHaveLength(1);
      expect(response.total).toBe(1);
      expect(response.currentPage).toBe(1);
      expect(response.pages).toBe(1);
      expect(response.items[0]).toEqual(showcaseProduct);

      expect(response.items[0].category!.id).toEqual(subCategory.id);
      expect(response.items[0].category!.rootCategory!.id).toEqual(
        category!.id,
      );

      expect(response.items[0].category!.name).toEqual(subCategory.name);
      expect(response.items[0].category!.rootCategory!.name).toEqual(
        category!.name,
      );
    });
  });
});
