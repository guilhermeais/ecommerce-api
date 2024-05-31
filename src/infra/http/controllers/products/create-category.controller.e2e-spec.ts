import { DefaultExceptionFilter } from '@/infra/http/filters/default-exception-filter.filter';

import { EventManager } from '@/core/types/events';
import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { CategoriesRepository } from '@/domain/product/application/gateways/repositories/categories-repository';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';
import { CreateCategoryBody } from './create-category.controller';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { CategoryFactory } from 'test/products/enterprise/entities/make-category';
import { CategoryHTTPResponse } from './presenters/category-presenter';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';

describe('CreateCategoryController (E2E)', () => {
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

  function makeCreateCategoryBodyRequest(
    modifications?: Partial<CreateCategoryBody>,
  ): CreateCategoryBody {
    return {
      name: faker.commerce.department(),
      description: faker.lorem.sentence(),
      ...modifications,
    };
  }

  describe('[POST] /admin/categories', () => {
    it('should create a category', async () => {
      const { accessToken } = await userFactory.makeUser({
        role: Role.ADMIN,
      });

      const body = makeCreateCategoryBodyRequest();

      const response = await request(app.getHttpServer())
        .post('/admin/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(body);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: body.name,
        description: body.description,
      });

      const categoryOnDb = await categoriesRepository.findById(
        new UniqueEntityID(response.body.id),
      );

      expect(categoryOnDb).toBeDefined();
    });
  });

  describe('[POST] /admin/categories/:rootCategoryId/sub-category', () => {
    it('should create a sub-category', async () => {
      const { accessToken } = await userFactory.makeUser({
        role: Role.ADMIN,
      });

      const { category: rootCategory } = await categoryFactory.makeCategory();

      const body = makeCreateCategoryBodyRequest();

      const response = await request(app.getHttpServer())
        .post(`/admin/categories/${rootCategory.id.toString()}/sub-category`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(body);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject<CategoryHTTPResponse>({
        id: expect.any(String),
        name: body.name,
        description: body.description,
        rootCategory: {
          id: rootCategory.id.toString(),
          name: rootCategory.name,
          description: rootCategory.description,
        },
      });

      const categoryOnDb = await categoriesRepository.findById(
        new UniqueEntityID(response.body.id),
      );

      expect(categoryOnDb).toBeDefined();
    });

    it('should return 404 if the roo category of an sub-category does not exists', async () => {
      const { accessToken } = await userFactory.makeUser({
        role: Role.ADMIN,
      });

      const body = makeCreateCategoryBodyRequest();
      const rootCategoryId = faker.string.uuid();
      const response = await request(app.getHttpServer())
        .post(`/admin/categories/${rootCategoryId}/sub-category`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(body);

      expect(response.status).toBe(404);
      const expectedError = new EntityNotFoundError(
        'Categoria Pai',
        rootCategoryId,
      );
      expect(response.body.error).toEqual(expectedError.name);
      expect(response.body.message).toEqual([expectedError.message]);
      expect(response.body.details).toEqual(expectedError.details);

      const categoryOnDb = await categoriesRepository.findById(
        new UniqueEntityID(response.body.id),
      );

      expect(categoryOnDb).toBeNull();
    });
  });
});
