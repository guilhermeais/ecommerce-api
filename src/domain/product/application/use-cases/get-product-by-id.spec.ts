import { InMemoryProductsRepository } from '@/infra/database/in-memory/repositories/products/in-memory-products.repository';
import { Logger } from '@/shared/logger';
import { faker } from '@faker-js/faker/locale/af_ZA';
import { makeProduct } from 'test/products/enterprise/entities/make-product';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { ProductsRepository } from '../gateways/repositories/products-repository';
import {
  GetProductByIdRequest,
  GetProductByIdUseCase,
} from './get-product-by-id';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';

describe('GetProductByIdUseCase', () => {
  let sut: GetProductByIdUseCase;
  let productRepository: ProductsRepository;
  let logger: Logger;

  beforeEach(() => {
    productRepository = new InMemoryProductsRepository();
    logger = makeFakeLogger();

    sut = new GetProductByIdUseCase(productRepository, logger);
  });

  function makeGetProductByIdRequest(
    overrides?: Partial<GetProductByIdRequest>,
  ): GetProductByIdRequest {
    return {
      id: faker.string.uuid(),
      ...overrides,
    };
  }

  it('should get the product by id', async () => {
    const productToFound = makeProduct();
    await productRepository.save(productToFound);
    await Promise.all(
      Array.from({ length: 10 }).map(() =>
        productRepository.save(makeProduct()),
      ),
    );

    const result = await sut.execute(
      makeGetProductByIdRequest({
        id: productToFound.id.toString(),
      }),
    );

    expect(result).toBeDefined();
    expect(result).toEqual(productToFound);
  });

  it('should throw EntityNotFoundError if the product does not exists', async () => {
    await Promise.all(
      Array.from({ length: 10 }).map(() =>
        productRepository.save(makeProduct()),
      ),
    );

    const id = faker.string.uuid();

    const promise = sut.execute(
      makeGetProductByIdRequest({
        id,
      }),
    );

    await expect(promise).rejects.toThrowError(
      new EntityNotFoundError('Produto', id),
    );
  });
});
