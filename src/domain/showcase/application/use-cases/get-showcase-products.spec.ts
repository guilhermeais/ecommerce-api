import { InMemoryShowcaseProductRepository } from '@/infra/database/in-memory/repositories/showcase/in-memory-showcase-products-repository';
import { Logger } from '@/shared/logger';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { makeShowcaseProduct } from 'test/showcase/enterprise/entities/make-showcase-product';
import { GetShowcaseProductsUseCase } from './get-showcase-products';

describe('GetShowcaseProducts use case', () => {
  let sut: GetShowcaseProductsUseCase;
  let showcaseProductRepository: InMemoryShowcaseProductRepository;
  let logger: Logger;

  beforeEach(() => {
    logger = makeFakeLogger();
    showcaseProductRepository = new InMemoryShowcaseProductRepository();

    sut = new GetShowcaseProductsUseCase(showcaseProductRepository, logger);
  });

  it('should list showcase of products when has no showcase products', async () => {
    const result = await sut.execute({ page: 1, limit: 10 });

    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
    expect(result.pages).toBe(0);
  });

  it('should list showcase of products', async () => {
    showcaseProductRepository.products.push(
      ...Array.from({ length: 10 }, () => makeShowcaseProduct()),
    );
    const result = await sut.execute({ page: 1, limit: 5 });

    expect(result.total).toBe(10);
    expect(result.items).toHaveLength(5);
    expect(result.pages).toBe(2);
  });
});
