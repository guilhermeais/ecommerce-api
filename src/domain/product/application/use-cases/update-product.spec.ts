import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { EventManager } from '@/core/types/events';
import { InMemoryCategoriesRepository } from '@/infra/database/in-memory/repositories/products/in-memory-categories.repository';
import { InMemoryProductsRepository } from '@/infra/database/in-memory/repositories/products/in-memory-products.repository';
import { FakeStorageGateway } from '@/infra/storage/fake-storage';
import { Logger } from '@/shared/logger';
import { faker } from '@faker-js/faker';
import { FakeEventManager } from 'test/core/type/event/fake-event-manager';
import { makeCategory } from 'test/products/enterprise/entities/make-category';
import { makeProduct } from 'test/products/enterprise/entities/make-product';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { CategoriesRepository } from '../gateways/repositories/categories-repository';
import { ProductsRepository } from '../gateways/repositories/products-repository';
import { StorageGateway } from '../gateways/storage/storage-gateway';
import { UpdateProductRequest, UpdateProductUseCase } from './update-product';

describe('UpdateProduct use case', () => {
  let sut: UpdateProductUseCase;
  let storageGateway: StorageGateway;
  let productsRepository: ProductsRepository;
  let categoriesRepository: CategoriesRepository;
  let logger: Logger;
  let eventManager: EventManager;

  beforeEach(() => {
    logger = makeFakeLogger();
    productsRepository = new InMemoryProductsRepository();
    storageGateway = new FakeStorageGateway();
    eventManager = new FakeEventManager();
    categoriesRepository = new InMemoryCategoriesRepository();

    sut = new UpdateProductUseCase(
      productsRepository,
      storageGateway,
      logger,
      eventManager,
      categoriesRepository,
    );
  });

  function makeUpdateProductUseCaseRequest(
    modifications?: Partial<UpdateProductRequest>,
  ): UpdateProductRequest {
    return {
      id: faker.string.uuid(),
      description: faker.lorem.sentence(),
      name: faker.commerce.productName(),
      isShown: true,
      image: {
        body: Buffer.from(faker.image.dataUri()),
        name: faker.system.fileName(),
        type: faker.system.mimeType(),
      },
      price: Number(faker.commerce.price()),
      subCategoryId: faker.string.uuid(),
      updatedBy: {
        id: new UniqueEntityID(faker.string.uuid()),
        email: faker.internet.email(),
        name: faker.person.fullName(),
      },
      ...modifications,
    };
  }

  it('should throw EntityNotFoundError if the product does not exists', async () => {
    const request = makeUpdateProductUseCaseRequest();

    await expect(sut.execute(request)).rejects.toThrowError(
      new EntityNotFoundError('Produto', request.id),
    );
  });

  it('should update the product with a new subCategoryId', async () => {
    const newCategory = makeCategory();
    const product = makeProduct();

    await categoriesRepository.save(newCategory);
    await productsRepository.save(product);

    const request: UpdateProductRequest = {
      id: product.id.toString(),
      subCategoryId: newCategory.id.toString(),
      updatedBy: {
        id: new UniqueEntityID(faker.string.uuid()),
        email: faker.internet.email(),
        name: faker.person.fullName(),
      },
    };

    await sut.execute(request);

    const updatedProduct = await productsRepository.findById(
      new UniqueEntityID(request.id),
    );

    expect(updatedProduct).not.toBeNull();
    expect(updatedProduct?.name).toBe(product.name);
    expect(updatedProduct?.description).toBe(product.description);
    expect(updatedProduct?.price).toBe(product.price);
    expect(updatedProduct?.isShown).toBe(product.isShown);
    expect(updatedProduct?.subCategory.id.toString()).toBe(
      request.subCategoryId,
    );
    expect(updatedProduct?.image).toEqual(product.image);
  });

  it('should update the product with a new image', async () => {
    const product = makeProduct();
    const newImage = {
      body: Buffer.from(faker.image.dataUri(), 'base64'),
      name: faker.system.fileName(),
      type: faker.system.mimeType(),
    };

    await productsRepository.save(product);

    const request: UpdateProductRequest = {
      id: product.id.toString(),
      image: newImage,
      updatedBy: {
        id: new UniqueEntityID(faker.string.uuid()),
        email: faker.internet.email(),
        name: faker.person.fullName(),
      },
    };

    await sut.execute(request);

    const updatedProduct = await productsRepository.findById(
      new UniqueEntityID(request.id),
    );

    expect(updatedProduct).not.toBeNull();
    expect(updatedProduct?.name).toBe(product.name);
    expect(updatedProduct?.description).toBe(product.description);
    expect(updatedProduct?.price).toBe(product.price);
    expect(updatedProduct?.isShown).toBe(product.isShown);
    expect(updatedProduct?.subCategory.id.toString()).toBe(
      product.subCategory.id.toString(),
    );
    expect(updatedProduct?.image).toBeDefined();
  });

  it.each([
    {
      field: 'description',
      value: faker.lorem.sentence(),
    },
    {
      field: 'isShown',
      value: false,
    },
    {
      field: 'name',
      value: faker.commerce.productName(),
    },
    {
      field: 'price',
      value: Number(faker.commerce.price()),
    },
  ] as {
    field: keyof UpdateProductRequest;
    value: any;
  }[])(
    'should update the product with $field with $value',
    async ({ field, value }) => {
      const product = makeProduct();

      await productsRepository.save(product);

      const request: UpdateProductRequest = {
        id: product.id.toString(),
        [field]: value,
        updatedBy: {
          id: new UniqueEntityID(faker.string.uuid()),
          email: faker.internet.email(),
          name: faker.person.fullName(),
        },
      };

      await sut.execute(request);

      const updatedProduct = await productsRepository.findById(
        new UniqueEntityID(request.id),
      );

      expect(updatedProduct[field]).toEqual(value);
    },
  );
});
