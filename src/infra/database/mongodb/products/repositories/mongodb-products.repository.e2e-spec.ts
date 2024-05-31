import { ProductsRepository } from '@/domain/product/application/gateways/repositories/products-repository';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { INestApplication } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';

import { Administrator } from '@/domain/product/enterprise/entities/administrator';
import {
  CategoryFactory,
  makeCategory,
} from 'test/products/enterprise/entities/make-category';
import {
  ProductFactory,
  makeProduct,
} from 'test/products/enterprise/entities/make-product';
import { MongoProductModel } from '../schemas/product.model';
import { MongoDbProductsRepository } from './mongodb-products.repository';

describe('MongoDbProductsRepository', () => {
  let app: INestApplication;
  let sut: MongoDbProductsRepository;
  let categoryFactory: CategoryFactory;
  let productFactory: ProductFactory;
  let productModel: Model<MongoProductModel>;
  let userFactory: UserFactory;

  beforeAll(async () => {
    vi.useFakeTimers({
      now: new Date(),
    });

    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule, CryptographyModule],
      providers: [UserFactory, CategoryFactory, ProductFactory, UserFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    sut = moduleRef.get(ProductsRepository);
    categoryFactory = moduleRef.get(CategoryFactory);
    productFactory = moduleRef.get(ProductFactory);
    productModel = moduleRef.get(MongoProductModel.COLLECTION_NAME);
    userFactory = moduleRef.get(UserFactory);

    await app.init();
  });

  afterAll(async () => {
    vi.useRealTimers();
    await app.close();
  });

  describe('findById()', () => {
    it('should return null if the product does not exists', async () => {
      const product = await sut.findById(makeCategory().id);

      expect(product).toBeNull();
    });

    it('should find a product by id', async () => {
      const { user } = await userFactory.makeUser();
      const product = await productFactory.makeProduct({
        createdBy: Administrator.restore(
          {
            email: user.email.value,
            name: user.name,
          },
          user.id,
        ),
      });

      const productFound = await sut.findById(product.id);

      expect(productFound).toEqual(product);
    });
  });

  describe('save()', () => {
    it('should save an product', async () => {
      const { category } = await categoryFactory.makeCategory();
      const { category: subCategory } = await categoryFactory.makeCategory({
        rootCategory: category,
      });
      const product = makeProduct({
        subCategory: subCategory,
      });

      await sut.save(product);

      const productOnMongo = await productModel.findOne({
        id: product.id.toString(),
      });

      expect(productOnMongo).toBeDefined();

      expect(productOnMongo!.id).toEqual(product.id.toString());
      expect(productOnMongo!.name).toEqual(product.name);
      expect(productOnMongo!.description).toEqual(product.description);
      expect(productOnMongo!.subCategoryId).toEqual(subCategory!.id.toString());
      expect(productOnMongo!.price).toEqual(product.price);
      expect(productOnMongo!.image).toEqual(product.image);
      expect(productOnMongo!.createdById).toEqual(
        product.createdBy.id.toString(),
      );
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
      const { user } = await userFactory.makeUser();
      const { category } = await categoryFactory.makeCategory();
      const { category: subCategory } = await categoryFactory.makeCategory({
        rootCategory: category,
      });

      const products = await Promise.all(
        Array.from({ length: 10 }).map((_, i) =>
          productFactory.makeProduct(
            {
              subCategory: subCategory,
              createdBy: Administrator.restore(
                {
                  email: user.email.value,
                  name: user.name,
                },
                user.id,
              ),
            },
            new Date(2021, 1, i + 1),
          ),
        ),
      );

      const response = await sut.list({ page: 1, limit: 10 });

      expect(response.items).toHaveLength(10);
      expect(response.total).toBe(10);
      expect(response.currentPage).toBe(1);
      expect(response.pages).toBe(1);

      expect(response.items).toEqual(products);

      const secondResponse = await sut.list({ page: 2, limit: 10 });

      expect(secondResponse.items).toHaveLength(0);
    });

    it('should list the product with the category and subCategory', async () => {
      const { user } = await userFactory.makeUser();
      const { category } = await categoryFactory.makeCategory();
      const { category: subCategory } = await categoryFactory.makeCategory({
        rootCategory: category,
      });

      const product = await productFactory.makeProduct({
        subCategory: subCategory,
        createdBy: Administrator.restore(
          {
            email: user.email.value,
            name: user.name,
          },
          user.id,
        ),
      });

      const response = await sut.list({ page: 1, limit: 10 });

      expect(response.items).toHaveLength(1);
      expect(response.total).toBe(1);
      expect(response.currentPage).toBe(1);
      expect(response.pages).toBe(1);
      expect(response.items[0]).toEqual(product);
      expect(response.items[0].subCategory).toEqual(subCategory);
      expect(response.items[0].subCategory!.rootCategory).toEqual(category);
    });
  });
});
