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
import { ProductPresenter } from './presenters/product-presenter';
import { faker } from '@faker-js/faker';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';

describe('GetProductByIdController (E2E)', () => {
  let app: INestApplication;
  let productsRepository: ProductsRepository;
  let eventManager: EventManager;
  let userFactory: UserFactory;
  let productFactory: ProductFactory;

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

    await app.init();
  });

  beforeEach(async () => {
    eventManager.clearSubscriptions();
    await productsRepository.clear();
  });

  describe('[GET] /admin/products/:id', () => {
    it('should get the existing product by id', async () => {
      const { accessToken } = await userFactory.makeUser({
        role: Role.MASTER,
      });

      const productToFound = await productFactory.makeProduct();

      await Promise.all(
        Array.from({ length: 5 }).map(() => productFactory.makeProduct()),
      );

      const response = await request(app.getHttpServer())
        .get(`/admin/products/${productToFound.id.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(ProductPresenter.toHTTP(productToFound));
    });

    it('should get 404 if the given product id does not exists', async () => {
      const { accessToken } = await userFactory.makeUser({
        role: Role.MASTER,
      });

      await Promise.all(
        Array.from({ length: 5 }).map(() => productFactory.makeProduct()),
      );

      const fakeId = faker.string.uuid();

      const response = await request(app.getHttpServer())
        .get(`/admin/products/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      const expectedError = new EntityNotFoundError('Produto', fakeId);
      expect(response.body.error).toEqual(expectedError.name);
      expect(response.body.message).toEqual([expectedError.message]);
      expect(response.body.details).toEqual(expectedError.details);
    });
  });
});
