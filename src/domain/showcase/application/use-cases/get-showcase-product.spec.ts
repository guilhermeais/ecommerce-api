import { InMemoryShowcaseProductRepository } from '@/infra/database/in-memory/repositories/showcase/in-memory-showcase-products-repository';
import { Logger } from '@/shared/logger';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { makeShowcaseProduct } from 'test/showcase/enterprise/entities/make-showcase-product';
import { GetShowcaseProductUseCase } from './get-showcase-product';
import { faker } from '@faker-js/faker';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';

describe('GetShowcaseProduct Use Case', () => {
  let sut: GetShowcaseProductUseCase;
  let showcaseProductRepository: InMemoryShowcaseProductRepository;
  let logger: Logger;

  beforeEach(() => {
    logger = makeFakeLogger();
    showcaseProductRepository = new InMemoryShowcaseProductRepository();

    sut = new GetShowcaseProductUseCase(showcaseProductRepository, logger);
  });

  it('should throw EntityNotFound if the product does not exists', async () => {
    const id = faker.string.uuid();
    await expect(sut.execute({ id })).rejects.toThrowError(
      new EntityNotFoundError('Produto', id),
    );
  });

  it('should get the showcase product by id', async () => {
    const product = makeShowcaseProduct();
    showcaseProductRepository.products.push(product);

    const result = await sut.execute({ id: product.id.toString() });

    expect(result).toEqual(product);
  });
});
