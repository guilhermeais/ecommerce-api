import { DefaultExceptionFilter } from '@/infra/http/filters/default-exception-filter.filter';

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
import { UpdateCategoryBody } from './update-category.controller';

describe('UpdateCategoryController (E2E)', () => {
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

  describe('[PATCH] /admin/categories/:id', () => {
    it('should update a category', async () => {
      const { category } = await categoryFactory.makeCategory();
      const { accessToken } = await userFactory.makeUser({
        role: Role.ADMIN,
      });

      const body: UpdateCategoryBody = {
        name: 'Updated',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/categories/${category.id.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(body);

      expect(response.status).toBe(204);

      const categoryOnDb = await categoriesRepository.findById(category.id);

      expect(categoryOnDb).toBeDefined();
      expect(categoryOnDb?.name).toBe(body.name);
      expect(categoryOnDb?.description).toBe(category.description);
    });

    it('should return EntityNotFoundError if the category does not exists', async () => {
      const { accessToken } = await userFactory.makeUser({
        role: Role.ADMIN,
      });

      const body: UpdateCategoryBody = {
        name: 'Updated',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/categories/invalid-id`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(body);

      expect(response.status).toBe(404);
    });
  });
});
