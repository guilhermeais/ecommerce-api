import { DefaultExceptionFilter } from '@/infra/http/filters/default-exception-filter.filter';

import { EventManager, Events } from '@/core/types/events';
import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { ProductsRepository } from '@/domain/product/application/gateways/repositories/products-repository';
import { Product } from '@/domain/product/enterprise/entities/product';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';
import { CategoryFactory } from 'test/products/enterprise/entities/make-category';
import { ProductFactory } from 'test/products/enterprise/entities/make-product';
import { UpdateProductBody } from './update-product.controller';

describe('UpdateProductController (E2E)', () => {
  let app: INestApplication;
  let productsRepository: ProductsRepository;
  let eventManager: EventManager;
  let userFactory: UserFactory;
  let categoryFactory: CategoryFactory;
  let productFactory: ProductFactory;

  beforeAll(async () => {
    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule, CryptographyModule],
      providers: [UserFactory, CategoryFactory, ProductFactory],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalFilters(new DefaultExceptionFilter());

    productsRepository = moduleRef.get(ProductsRepository);
    eventManager = moduleRef.get(EventManager);
    userFactory = moduleRef.get(UserFactory);
    categoryFactory = moduleRef.get(CategoryFactory);
    productFactory = moduleRef.get(ProductFactory);

    await app.init();
  });

  beforeEach(async () => {
    eventManager.clearSubscriptions();
    await productsRepository.clear();
  });

  function makeUpdateProductBodyRequest(
    modifications?: Partial<UpdateProductBody>,
  ): UpdateProductBody {
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
    }, {} as UpdateProductBody);
  }

  describe('[PATCH] /admin/products/:id', () => {
    it.each([
      {
        field: 'name',
        value: faker.commerce.productName(),
      },
      {
        field: 'price',
        value: Number(faker.commerce.price()),
      },
      {
        field: 'description',
        value: faker.commerce.productDescription(),
      },
      {
        field: 'description',
        value: '',
      },
      {
        field: 'isShown',
        value: faker.datatype.boolean(),
      },
    ] as {
      field: keyof UpdateProductBody;
      value: any;
    }[])(
      'should update an existing product with $field with $value',
      async ({ field, value }) => {
        const existingProduct = await productFactory.makeProduct();

        const { accessToken, user } = await userFactory.makeUser({
          role: Role.ADMIN,
        });

        const body: UpdateProductBody = {
          [field]: value,
        };

        const productUpdatedEvent = new Promise<Product>((resolve) => {
          eventManager.subscribe(Events.PRODUCT_UPDATED, (product) => {
            resolve(product);
          });
        });

        const response = await request(app.getHttpServer())
          .patch(`/admin/products/${existingProduct.id.toString()}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .field(body);

        expect(response.status).toBe(201);

        const product = await productsRepository.findById(existingProduct.id);

        expect(product).toBeDefined();
        expect(product!.id.toString()).toEqual(existingProduct.id.toString());
        expect(product!.updatedBy.id.equals(user.id)).toBeTruthy();
        expect(product![field]).toBe(value);

        const updatedProduct = await productUpdatedEvent;

        expect(updatedProduct).toBeDefined();
        expect(updatedProduct.id.toString()).toEqual(
          existingProduct.id.toString(),
        );
        expect(updatedProduct.updatedBy.id.equals(user.id)).toBeTruthy();
        expect(updatedProduct[field]).toBe(value);
      },
    );

    it('should update the product category', async () => {
      const { category: newCategory } = await categoryFactory.makeCategory();
      const existingProduct = await productFactory.makeProduct();

      const { accessToken, user } = await userFactory.makeUser({
        role: Role.ADMIN,
      });

      const body: UpdateProductBody = {
        subCategoryId: newCategory.id.toString(),
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/products/${existingProduct.id.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .field(body);

      expect(response.status).toBe(201);

      const product = await productsRepository.findById(existingProduct.id);

      expect(product).toBeDefined();
      expect(product!.id.toString()).toEqual(existingProduct.id.toString());
      expect(product!.updatedBy.id.equals(user.id)).toBeTruthy();
      expect(product!.subCategory).toEqual(newCategory);
    });

    it('should update the category to null', async () => {
      const existingProduct = await productFactory.makeProduct();

      const { accessToken, user } = await userFactory.makeUser({
        role: Role.ADMIN,
      });

      const body: UpdateProductBody = {
        subCategoryId: '',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/products/${existingProduct.id.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .field(body);

      expect(response.status).toBe(201);

      const product = await productsRepository.findById(existingProduct.id);

      expect(product).toBeDefined();
      expect(product!.id.toString()).toEqual(existingProduct.id.toString());
      expect(product!.updatedBy.id.equals(user.id)).toBeTruthy();
      expect(product!.subCategory).toBeNull();
    });

    it('should update the product image', async () => {
      const existingProduct = await productFactory.makeProduct({
        image: null,
      });

      const { accessToken, user } = await userFactory.makeUser({
        role: Role.ADMIN,
      });

      const body = makeUpdateProductBodyRequest();

      const response = await request(app.getHttpServer())
        .patch(`/admin/products/${existingProduct.id.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('image', './test/e2e/fake-image.jpg', {
          contentType: 'image/jpeg',
        })
        .field(body);

      expect(response.status).toBe(201);

      const product = await productsRepository.findById(existingProduct.id);

      expect(product).toBeDefined();
      expect(product!.id.toString()).toEqual(existingProduct.id.toString());
      expect(product!.updatedBy.id.equals(user.id)).toBeTruthy();
      expect(product!.image).toBeTypeOf('string');
    });

    describe('Exceptions', () => {
      it('should return 400 if the image is invalid type', async () => {
        const existingProduct = await productFactory.makeProduct();
        const { accessToken } = await userFactory.makeUser({
          role: Role.ADMIN,
        });

        const body = makeUpdateProductBodyRequest();

        const response = await request(app.getHttpServer())
          .patch(`/admin/products/${existingProduct.id.toString()}`)
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
        const existingProduct = await productFactory.makeProduct();
        const { accessToken } = await userFactory.makeUser({
          role: Role.ADMIN,
        });

        const body = makeUpdateProductBodyRequest();

        const fakeBuffer = Buffer.alloc(4 * 1024 * 1024);

        const response = await request(app.getHttpServer())
          .patch(`/admin/products/${existingProduct.id.toString()}`)
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
          body: {
            price: 0,
          },
          expectedResponse: {
            statusCode: 400,
            message: ['Preço do produto deve ser positivo!'],
            error: 'BadRequestException',
          },
          expectedStatus: 400,
        },
        {
          body: {
            price: 8.123,
          },
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
        body: UpdateProductBody;
        expectedStatus: number;
        expectedResponse: any;
      }[])(
        'should return $expectedStatus when create product with $body',
        async ({ body, expectedStatus, expectedResponse }) => {
          const existingProduct = await productFactory.makeProduct();
          const { accessToken } = await userFactory.makeUser({
            role: Role.ADMIN,
          });

          const response = await request(app.getHttpServer())
            .patch(`/admin/products/${existingProduct.id.toString()}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .field(body);

          expect(response.status).toBe(expectedStatus);
          expect(response.body).toEqual(expectedResponse);
        },
      );
    });
  });
});
