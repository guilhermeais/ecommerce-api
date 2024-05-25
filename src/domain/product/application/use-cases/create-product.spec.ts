import { EventManager, Events } from '@/core/types/events';
import { InMemoryCategoriesRepository } from '@/infra/database/in-memory/repositories/products/in-memory-categories.repository';
import { InMemoryProductsRepository } from '@/infra/database/in-memory/repositories/products/in-memory-products.repository';
import { Logger } from '@/shared/logger';
import { faker } from '@faker-js/faker';
import { FakeEventManager } from 'test/core/type/event/fake-event-manager';
import { FakeStorageGateway } from 'test/products/application/gateways/storage/fake-storage';
import { makeCategory } from 'test/products/enterprise/entities/make-category';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { Product } from '../../enterprise/entities/product';
import { CategoriesRepository } from '../gateways/repositories/categories-repository';
import { ProductsRepository } from '../gateways/repositories/products-repository';
import { StorageGateway } from '../gateways/storage/storage-gateway';
import { CreateProductRequest, CreateProductUseCase } from './create-product';

describe('CreateProduct use case', () => {
  let sut: CreateProductUseCase;
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

    sut = new CreateProductUseCase(
      productsRepository,
      storageGateway,
      logger,
      eventManager,
      categoriesRepository,
    );
  });

  function makeCreateProductUseCaseRequest(
    modifications?: Partial<CreateProductRequest>,
  ): CreateProductRequest {
    return {
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
      ...modifications,
    };
  }

  it('should create a product', async () => {
    const category = makeCategory();

    await categoriesRepository.save(category);
    const request = makeCreateProductUseCaseRequest({
      subCategoryId: category.id.toString(),
    });

    const productEventPromise = new Promise<Product>((resolve) => {
      eventManager.subscribe(Events.PRODUCT_CREATED, (product) => {
        resolve(product);
      });
    });
    const response = await sut.execute(request);

    expect(response).toBeDefined();
    expect(response.id).toBeDefined();
    expect(response.name).toBe(request.name);
    expect(response.description).toBe(request.description);
    expect(response.price).toBe(request.price);
    expect(response.isShown).toBe(request.isShown);
    expect(response.subCategory!.id.toString()).toBe(request.subCategoryId);
    expect(response.image).toBeDefined();

    const productOnRepo = await productsRepository.findById(response.id);

    expect(productOnRepo).toBeDefined();
    expect(productOnRepo!.id).toEqual(response.id);
    expect(productOnRepo!.name).toBe(request.name);
    expect(productOnRepo!.description).toBe(request.description);
    expect(productOnRepo!.price).toBe(request.price);
    expect(productOnRepo!.isShown).toBe(request.isShown);
    expect(productOnRepo!.subCategory!.id.toString()).toBe(
      request.subCategoryId,
    );
    expect(productOnRepo!.image).toBe(response.image);

    const eventProduct = await productEventPromise;

    expect(eventProduct).toBeDefined();
    expect(eventProduct.id).toEqual(response.id);
  });

  it('should not fail if the storage fails', async () => {
    const category = makeCategory();

    await categoriesRepository.save(category);
    const request = makeCreateProductUseCaseRequest({
      subCategoryId: category.id.toString(),
    });

    vitest
      .spyOn(storageGateway, 'upload')
      .mockRejectedValue(new Error('Error'));

    const response = await sut.execute(request);

    expect(response).toBeDefined();
    expect(response.id).toBeDefined();
    expect(response.name).toBe(request.name);
    expect(response.description).toBe(request.description);
    expect(response.price).toBe(request.price);
    expect(response.isShown).toBe(request.isShown);
    expect(response.subCategory!.id.toString()).toBe(request.subCategoryId);
    expect(response.image).toBeUndefined();

    const productOnRepo = await productsRepository.findById(response.id);

    expect(productOnRepo).toBeDefined();
  });

  it('should throw if the provided category does not exists', async () => {});
});
