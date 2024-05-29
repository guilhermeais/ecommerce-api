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

describe('CreateCategoryController (E2E)', () => {
  let app: INestApplication;
  let categoriesRepository: CategoriesRepository;
  let eventManager: EventManager;
  let userFactory: UserFactory;

  beforeAll(async () => {
    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule, CryptographyModule],
      providers: [UserFactory],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalFilters(new DefaultExceptionFilter());

    categoriesRepository = moduleRef.get(CategoriesRepository);
    eventManager = moduleRef.get(EventManager);
    userFactory = moduleRef.get(UserFactory);

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
});
