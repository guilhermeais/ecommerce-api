import { Logger } from '@/shared/logger';
import { ProductsRepository } from '../gateways/repositories/products-repository';
import { ListProductsRequest, ListProductsUseCase } from './list-products';
import { InMemoryProductsRepository } from '@/infra/database/in-memory/repositories/products/in-memory-products.repository';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { makeProduct } from 'test/products/enterprise/entities/make-product';
import { makeCategory } from 'test/products/enterprise/entities/make-category';

describe('ListPRoductsUseCase', () => {
  let sut: ListProductsUseCase;
  let productRepository: ProductsRepository;
  let logger: Logger;

  beforeEach(() => {
    productRepository = new InMemoryProductsRepository();
    logger = makeFakeLogger();

    sut = new ListProductsUseCase(productRepository, logger);
  });

  function makeListProductsRequest(
    overrides?: Partial<ListProductsRequest>,
  ): ListProductsRequest {
    return {
      page: 1,
      limit: 10,
      ...overrides,
    };
  }

  it('should list all products paginated', async () => {
    await Promise.all(
      Array.from({ length: 10 }).map(() =>
        productRepository.save(makeProduct()),
      ),
    );

    const result = await sut.execute(
      makeListProductsRequest({
        limit: 5,
        page: 1,
      }),
    );

    expect(result.items).toHaveLength(5);
    expect(result.total).toBe(10);
    expect(result.pages).toBe(2);
    expect(result.currentPage).toBe(1);

    const secondResult = await sut.execute(
      makeListProductsRequest({
        limit: 5,
        page: 2,
      }),
    );

    expect(secondResult.items).toHaveLength(5);
    expect(secondResult.total).toBe(10);
    expect(secondResult.pages).toBe(2);
    expect(secondResult.currentPage).toBe(2);
  });

  it('should list all products paginated filtered by sub category id', async () => {
    const category = makeCategory({
      name: 'Category to Found',
    });
    const subCategory = makeCategory({
      rootCategory: category,
    });

    const productToFound = makeProduct({
      subCategory,
    });

    await Promise.all(
      Array.from({ length: 10 }).map(() =>
        productRepository.save(makeProduct()),
      ),
    );

    await productRepository.save(productToFound);

    const result = await sut.execute(
      makeListProductsRequest({
        limit: 5,
        page: 1,
        subCategoryId: subCategory.id.toString(),
      }),
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id.equals(productToFound.id)).toBeTruthy();
  });

  it('should list all products paginated filtered by sub category id', async () => {
    const category = makeCategory({
      name: 'Category to Found',
    });
    const subCategory = makeCategory({
      rootCategory: category,
    });

    const productToFound = makeProduct({
      subCategory,
    });

    await Promise.all(
      Array.from({ length: 10 }).map(() =>
        productRepository.save(makeProduct()),
      ),
    );

    await productRepository.save(productToFound);

    const result = await sut.execute(
      makeListProductsRequest({
        limit: 5,
        page: 1,
        categoryId: category.id.toString(),
      }),
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id.equals(productToFound.id)).toBeTruthy();
  });
});
