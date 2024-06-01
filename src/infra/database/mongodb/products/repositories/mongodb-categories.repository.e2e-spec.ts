import { CategoriesRepository } from '@/domain/product/application/gateways/repositories/categories-repository';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { INestApplication } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';
import {
  CategoryFactory,
  makeCategory,
} from 'test/products/enterprise/entities/make-category';
import { MongoCategoryModel } from '../schemas/category.model';
import { MongoDbCategoriesRepository } from './mongodb-categories.repository';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

describe('MongoDbCategoriesRepository', () => {
  let app: INestApplication;
  let sut: MongoDbCategoriesRepository;
  let categoryFactory: CategoryFactory;
  let categoryModel: Model<MongoCategoryModel>;

  beforeAll(async () => {
    vi.useFakeTimers({
      now: new Date(),
    });

    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule, CryptographyModule],
      providers: [UserFactory, CategoryFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    sut = moduleRef.get(CategoriesRepository);
    categoryFactory = moduleRef.get(CategoryFactory);
    categoryModel = moduleRef.get(MongoCategoryModel.COLLECTION_NAME);

    await app.init();
  });

  afterAll(async () => {
    vi.useRealTimers();
    await app.close();
  });

  describe('findById()', () => {
    it('should return null if the category does not exists', async () => {
      const category = await sut.findById(makeCategory().id);

      expect(category).toBeNull();
    });

    it('should find a category by id', async () => {
      const { category } = await categoryFactory.makeCategory();

      const categoryFound = await sut.findById(category.id);

      expect(categoryFound).toEqual(category);
    });
  });

  describe('save()', () => {
    it('should save an category', async () => {
      const category = makeCategory();

      await sut.save(category);

      const categoryOnMongo = await categoryModel.findById(
        category.id.toString(),
      );

      expect(categoryOnMongo).toBeDefined();

      expect(categoryOnMongo?.id).toEqual(category.id.toString());
      expect(categoryOnMongo?.name).toEqual(category.name);
      expect(categoryOnMongo?.description).toEqual(category.description);
      expect(categoryOnMongo?.rootCategoryId).toBeUndefined();
    });

    it('should save an category with root category', async () => {
      const rootCategory = makeCategory();
      const category = makeCategory({
        rootCategory,
      });

      await sut.save(category);

      const categoryOnMongo = await categoryModel.findById(
        category.id.toString(),
      );

      expect(categoryOnMongo).toBeDefined();

      expect(categoryOnMongo?.id).toEqual(category.id.toString());
      expect(categoryOnMongo?.name).toEqual(category.name);
      expect(categoryOnMongo?.description).toEqual(category.description);
      expect(categoryOnMongo?.rootCategoryId).toEqual(
        category.rootCategory?.id.toString(),
      );
    });
  });

  describe('list()', () => {
    it('should return empty items when has no categories', async () => {
      const response = await sut.list({ page: 1, limit: 10 });

      expect(response.items).toHaveLength(0);
      expect(response.total).toBe(0);
      expect(response.currentPage).toBe(1);
      expect(response.pages).toBe(0);
    });

    it('should paginate existing categories', async () => {
      const categories = await Promise.all(
        Array.from({ length: 10 }).map(async (_, i) => {
          return (
            await categoryFactory.makeCategory(
              undefined,
              new Date(2021, 1, i + 1),
            )
          ).category;
        }),
      );

      const response = await sut.list({ page: 1, limit: 5 });

      expect(response.items).toHaveLength(5);

      expect(response.items).toEqual(
        categories.slice(0, 5).map((c) => {
          c.updatedAt = c.createdAt;

          return c;
        }),
      );

      expect(response.total).toBe(10);
      expect(response.currentPage).toBe(1);
      expect(response.pages).toBe(2);

      const secondResponse = await sut.list({ page: 2, limit: 5 });

      expect(secondResponse.items).toHaveLength(5);
      expect(secondResponse.total).toBe(10);
      expect(secondResponse.currentPage).toBe(2);
      expect(secondResponse.pages).toBe(2);

      const thirdResponse = await sut.list({ page: 3, limit: 5 });

      expect(thirdResponse.items).toHaveLength(0);
    });

    it('should list filtering by category name', async () => {
      const { category: categoryToFind } = await categoryFactory.makeCategory({
        name: 'Category to find',
      });

      await Promise.all(
        Array.from({ length: 10 }).map(async (_, i) => {
          return (
            await categoryFactory.makeCategory(
              undefined,
              new Date(2021, 1, i + 1),
            )
          ).category;
        }),
      );

      const response = await sut.list({
        page: 1,
        limit: 10,
        name: categoryToFind.name,
      });

      categoryToFind.updatedAt = categoryToFind.createdAt;
      expect(response.items).toHaveLength(1);
      expect(response.items[0]).toEqual(categoryToFind);
      expect(response.total).toBe(1);
      expect(response.currentPage).toBe(1);
      expect(response.pages).toBe(1);
    });

    it('should list filtering by root category id', async () => {
      const { category: rootCategory } = await categoryFactory.makeCategory({
        name: 'Root category',
      });
      const { category: categoryToFind } = await categoryFactory.makeCategory({
        rootCategory,
      });

      await Promise.all(
        Array.from({ length: 10 }).map(async (_, i) => {
          return (
            await categoryFactory.makeCategory(
              undefined,
              new Date(2021, 1, i + 1),
            )
          ).category;
        }),
      );

      const response = await sut.list({
        page: 1,
        limit: 10,
        rootCategoryId: rootCategory.id,
      });

      categoryToFind.updatedAt = categoryToFind.createdAt;
      rootCategory.updatedAt = rootCategory.createdAt;
      expect(response.items).toHaveLength(1);
      expect(response.items[0]).toEqual(categoryToFind);
      expect(response.total).toBe(1);
      expect(response.currentPage).toBe(1);
      expect(response.pages).toBe(1);
    });

    it('should list filtering by root category id as null', async () => {
      const { category: rootCategory } = await categoryFactory.makeCategory(
        {
          name: 'Root category',
        },
        new Date(2021, 0, 1),
      );

      const { category: categoryToFind } = await categoryFactory.makeCategory(
        undefined,
        new Date(2021, 0, 2),
      );

      await Promise.all(
        Array.from({ length: 10 }).map(async (_, i) => {
          return (
            await categoryFactory.makeCategory(
              {
                rootCategory,
              },
              new Date(2021, 1, i + 1),
            )
          ).category;
        }),
      );

      const response = await sut.list({
        page: 1,
        limit: 10,
        rootCategoryId: null,
      });

      expect(response.items).toHaveLength(2);
      expect(response.items[0]).toEqual(rootCategory);
      expect(response.items[1]).toEqual(categoryToFind);
      expect(response.total).toBe(2);
      expect(response.currentPage).toBe(1);
      expect(response.pages).toBe(1);
    });

    it('should list all categories without pagination if limit is -1', async () => {
      const categories = await Promise.all(
        Array.from({ length: 10 }).map(async (_, i) => {
          return (
            await categoryFactory.makeCategory(
              undefined,
              new Date(2021, 1, i + 1),
            )
          ).category;
        }),
      );

      const response = await sut.list({ page: 1, limit: -1 });

      expect(response.items).toHaveLength(10);

      expect(response.items).toEqual(categories);

      expect(response.total).toBe(categories.length);
      expect(response.currentPage).toBe(1);
      expect(response.pages).toBe(categories.length);
    });
  });

  describe('delete()', () => {
    it('should delete and existing category', async () => {
      const { category } = await categoryFactory.makeCategory();

      const exists = await categoryModel.exists({
        id: category.id.toString(),
      });

      expect(exists?._id).toBeDefined();

      await sut.delete(category.id);

      const existsAfterDelete = await categoryModel.exists({
        id: category.id.toString(),
      });

      expect(existsAfterDelete?._id).toBeUndefined();
    });
  });

  describe('exists()', () => {
    it('should return true if the category exists', async () => {
      const { category } = await categoryFactory.makeCategory();
      const exists = await sut.exists(category.id);
      expect(exists).toBe(true);
    });

    it('should return false if the category does not exists', async () => {
      const exists = await sut.exists(new UniqueEntityID());
      expect(exists).toBe(false);
    });
  });
});
