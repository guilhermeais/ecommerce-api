import { DefaultExceptionFilter } from '@/infra/http/filters/default-exception-filter.filter';

import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { EventManager } from '@/core/types/events';
import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { ProductsRepository } from '@/domain/product/application/gateways/repositories/products-repository';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';
import { CategoryFactory } from 'test/products/enterprise/entities/make-category';
import { CreateProductBody } from './create-product.controller';

describe('CreateProductController (E2E)', () => {
  let app: INestApplication;
  let productsRepository: ProductsRepository;
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

    productsRepository = moduleRef.get(ProductsRepository);
    eventManager = moduleRef.get(EventManager);
    userFactory = moduleRef.get(UserFactory);
    categoryFactory = moduleRef.get(CategoryFactory);

    await app.init();
  });

  beforeEach(async () => {
    eventManager.clearSubscriptions();
    await productsRepository.clear();
  });

  function makeCreateProductBodyRequest(
    modifications?: Partial<CreateProductBody>,
  ): CreateProductBody {
    return Object.entries({
      name: faker.commerce.productName(),
      price: Number(faker.commerce.price()),
      description: faker.commerce.productDescription(),
      isShown: faker.datatype.boolean(),
      ...modifications,
    }).reduce((acc, [key, value]) => {
      if (value === undefined) {
        Reflect.deleteProperty(acc, key);

        return acc;
      }

      return {
        ...acc,
        [key]: value,
      };
    }, {} as CreateProductBody);
  }

  describe('[POST] /admin/products', () => {
    it('should create a product', async () => {
      const { accessToken, user } = await userFactory.makeUser({
        role: Role.ADMIN,
      });

      const { category } = await categoryFactory.makeCategory();

      const body = makeCreateProductBodyRequest({
        subCategoryId: category.id.toString(),
        isShown: false,
      });

      const response = await request(app.getHttpServer())
        .post('/admin/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('image', './test/e2e/fake-image.jpg')
        .field(body);

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe(body.name);
      expect(response.body.price).toBe(body.price);
      expect(response.body.description).toBe(body.description);
      expect(response.body.isShown).toBe(body.isShown);
      expect(response.body.image).toBeDefined();
      expect(response.body.category.id).toBe(category.id.toString());
      expect(response.body.createdBy.id).toBe(user.id.toString());

      const product = await productsRepository.findById(
        new UniqueEntityID(response.body.id),
      );

      expect(product).toBeDefined();
      expect(product!.name).toBe(body.name);
      expect(product!.price).toBe(body.price);
      expect(product!.description).toBe(body.description);
      expect(product!.image).toBeTypeOf('string');
      expect(product!.createdBy.id.equals(user.id)).toBeTruthy();
    });

    it('should create a product without category', async () => {
      const { accessToken, user } = await userFactory.makeUser({
        role: Role.ADMIN,
      });

      const body = makeCreateProductBodyRequest({
        isShown: false,
      });

      delete body.subCategoryId;

      const response = await request(app.getHttpServer())
        .post('/admin/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('image', './test/e2e/fake-image.jpg')
        .field(body);

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe(body.name);
      expect(response.body.price).toBe(body.price);
      expect(response.body.description).toBe(body.description);
      expect(response.body.isShown).toBe(body.isShown);
      expect(response.body.image).toBeDefined();
      expect(response.body.category).toBeUndefined();
      expect(response.body.createdBy.id).toBe(user.id.toString());

      const product = await productsRepository.findById(
        new UniqueEntityID(response.body.id),
      );

      expect(product).toBeDefined();
      expect(product!.name).toBe(body.name);
      expect(product!.price).toBe(body.price);
      expect(product!.description).toBe(body.description);
      expect(product!.image).toBeTypeOf('string');
      expect(product!.createdBy.id.equals(user.id)).toBeTruthy();
    });

    it('should create a product without image', async () => {
      const { accessToken, user } = await userFactory.makeUser({
        role: Role.ADMIN,
      });

      const body = makeCreateProductBodyRequest({
        isShown: false,
      });

      delete body.subCategoryId;

      const response = await request(app.getHttpServer())
        .post('/admin/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .field(body);

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe(body.name);
      expect(response.body.price).toBe(body.price);
      expect(response.body.description).toBe(body.description);
      expect(response.body.isShown).toBe(body.isShown);
      expect(response.body.image).toBeUndefined();
      expect(response.body.category).toBeUndefined();
      expect(response.body.createdBy.id).toBe(user.id.toString());

      const product = await productsRepository.findById(
        new UniqueEntityID(response.body.id),
      );

      expect(product).toBeDefined();
      expect(product!.name).toBe(body.name);
      expect(product!.price).toBe(body.price);
      expect(product!.description).toBe(body.description);
      expect(product!.image).toBeUndefined();
      expect(product!.createdBy.id.equals(user.id)).toBeTruthy();
    });

    describe('Exceptions', () => {
      it('should return 400 if the image is invalid type', async () => {
        const { accessToken } = await userFactory.makeUser({
          role: Role.ADMIN,
        });

        const body = makeCreateProductBodyRequest();

        const response = await request(app.getHttpServer())
          .post('/admin/products')
          .set('Authorization', `Bearer ${accessToken}`)
          .attach('image', './test/e2e/fake-image.jpg', {
            contentType: 'image/gif',
          })
          .field(body);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 'BadRequestException',
          message: 'Validation failed (expected type is .(png|jpg|jpeg))',
          statusCode: 400,
        });
      });

      it('should throw if image has more than 3MB', async () => {
        const { accessToken } = await userFactory.makeUser({
          role: Role.ADMIN,
        });

        const body = makeCreateProductBodyRequest();

        const fakeBuffer = Buffer.alloc(4 * 1024 * 1024);

        const response = await request(app.getHttpServer())
          .post('/admin/products')
          .set('Authorization', `Bearer ${accessToken}`)
          .attach('image', fakeBuffer, {
            contentType: 'image/jpeg',
            filename: 'fake-image.jpg',
          })
          .field(body);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 'BadRequestException',
          message: 'Imagem deve ter no máximo 3MB!',
          statusCode: 400,
        });
      });

      it.each([
        {
          body: makeCreateProductBodyRequest({ name: undefined }),
          expectedResponse: {
            statusCode: 400,
            message: ['Nome do produto é obrigatório!'],
            error: 'BadRequestException',
          },
          expectedStatus: 400,
        },
        {
          body: makeCreateProductBodyRequest({ price: undefined }),
          expectedResponse: {
            statusCode: 400,
            message: ['Preço do produto é obrigatório!'],
            error: 'BadRequestException',
          },
          expectedStatus: 400,
        },
        {
          body: makeCreateProductBodyRequest({ price: 10.333 }),
          expectedResponse: {
            statusCode: 400,
            message: [
              'Preço do produto deve ser um número decimal com duas casas decimais!',
            ],
            error: 'BadRequestException',
          },
          expectedStatus: 400,
        },
      ] as {
        body: CreateProductBody;
        expectedStatus: number;
        expectedResponse: any;
      }[])(
        'should return $expectedStatus when create product with $body',
        async ({ body, expectedStatus, expectedResponse }) => {
          const { accessToken } = await userFactory.makeUser({
            role: Role.ADMIN,
          });

          const response = await request(app.getHttpServer())
            .post('/admin/products')
            .set('Authorization', `Bearer ${accessToken}`)
            .field(body);

          expect(response.status).toBe(expectedStatus);
          expect(response.body).toEqual(expectedResponse);
        },
      );
    });
  });
});
