import { InMemoryShowcaseCategoriesRepository } from '@/infra/database/in-memory/repositories/showcase/in-memory-showcase-categories-repository';
import { Logger } from '@/shared/logger';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { makeShowcaseCategory } from 'test/showcase/enterprise/entities/make-showcase-category';
import { GetShowcaseCategoriesUseCase } from './get-showcase-categories';

describe('GetShowcaseCategories use case', () => {
  let sut: GetShowcaseCategoriesUseCase;
  let showcaseCategoriesRepository: InMemoryShowcaseCategoriesRepository;
  let logger: Logger;

  beforeEach(() => {
    logger = makeFakeLogger();
    showcaseCategoriesRepository = new InMemoryShowcaseCategoriesRepository();

    sut = new GetShowcaseCategoriesUseCase(
      showcaseCategoriesRepository,
      logger,
    );
  });

  it('should list showcase of categories when has no showcase categories', async () => {
    const result = await sut.execute({ page: 1, limit: 10 });

    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
    expect(result.pages).toBe(0);
  });

  it('should list showcase of categories', async () => {
    showcaseCategoriesRepository.categories.push(
      ...Array.from({ length: 10 }, () => makeShowcaseCategory()),
    );
    const result = await sut.execute({ page: 1, limit: 5 });

    expect(result.total).toBe(10);
    expect(result.items).toHaveLength(5);
    expect(result.pages).toBe(2);
  });
});
