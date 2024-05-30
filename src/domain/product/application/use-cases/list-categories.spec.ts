import { Logger } from '@/shared/logger';
import { CategoriesRepository } from '../gateways/repositories/categories-repository';
import {
  ListCategoriesRequest,
  ListCategoriesUseCase,
} from './list-categories';
import { InMemoryCategoriesRepository } from '@/infra/database/in-memory/repositories/products/in-memory-categories.repository';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { makeCategory } from 'test/products/enterprise/entities/make-category';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';

describe('ListCategoriesUseCase', () => {
  let sut: ListCategoriesUseCase;
  let categoriesRepository: CategoriesRepository;
  let logger: Logger;

  beforeEach(() => {
    categoriesRepository = new InMemoryCategoriesRepository();
    logger = makeFakeLogger();
    sut = new ListCategoriesUseCase(categoriesRepository, logger);
  });

  function makeListCategoriesRequest(
    modifications?: Partial<ListCategoriesRequest>,
  ): ListCategoriesRequest {
    return {
      page: 1,
      limit: 10,
      ...modifications,
    };
  }

  it('should list empty categories', async () => {
    const result = await sut.execute({ page: 1, limit: 10 });

    expect(result).toEqual({
      items: [],
      total: 0,
      pages: 0,
      limit: 10,
      currentPage: 1,
    });
  });

  it('should list categories paginated', async () => {
    await Promise.all(
      Array.from({ length: 15 }).map(() =>
        categoriesRepository.save(makeCategory()),
      ),
    );

    const result = await sut.execute(
      makeListCategoriesRequest({ page: 1, limit: 10 }),
    );

    expect(result.total).toEqual(15);
    expect(result.pages).toEqual(2);
    expect(result.currentPage).toEqual(1);
    expect(result.limit).toEqual(10);
    expect(result.items.length).toEqual(10);

    const secondResult = await sut.execute(
      makeListCategoriesRequest({ page: 2, limit: 10 }),
    );

    expect(secondResult.total).toEqual(15);
    expect(secondResult.pages).toEqual(2);
    expect(secondResult.currentPage).toEqual(2);
    expect(secondResult.limit).toEqual(10);
    expect(secondResult.items.length).toEqual(5);
  });

  it('should list filtering by name', async () => {
    const nameToFilter = 'Category to be found';
    const categoryToFound = makeCategory({ name: nameToFilter });
    await Promise.all(
      Array.from({ length: 15 }).map(() =>
        categoriesRepository.save(makeCategory()),
      ),
    );
    await categoriesRepository.save(categoryToFound);

    const result = await sut.execute(
      makeListCategoriesRequest({ page: 1, limit: 10, name: nameToFilter }),
    );

    expect(result.total).toEqual(1);
    expect(result.pages).toEqual(1);
    expect(result.currentPage).toEqual(1);
    expect(result.limit).toEqual(10);
    expect(result.items.length).toEqual(1);
    expect(result.items[0]).toEqual(categoryToFound);
  });

  it('should list filtering by rootCategoryId', async () => {
    const rootCategory = makeCategory();
    await categoriesRepository.save(rootCategory);
    const categoryToFound = makeCategory({ rootCategory });
    await Promise.all(
      Array.from({ length: 15 }).map(() =>
        categoriesRepository.save(makeCategory()),
      ),
    );
    await categoriesRepository.save(categoryToFound);

    const result = await sut.execute(
      makeListCategoriesRequest({
        page: 1,
        limit: 10,
        rootCategoryId: rootCategory.id.toString(),
      }),
    );

    expect(result.total).toEqual(1);
    expect(result.pages).toEqual(1);
    expect(result.currentPage).toEqual(1);
    expect(result.limit).toEqual(10);
    expect(result.items.length).toEqual(1);
    expect(result.items[0]).toEqual(categoryToFound);
  });

  it('should throw EntityNotFoundError if the root category does not exists', async () => {
    await expect(
      sut.execute(
        makeListCategoriesRequest({
          page: 1,
          limit: 10,
          rootCategoryId: 'invalid-id',
        }),
      ),
    ).rejects.toThrowError(
      new EntityNotFoundError('Categoria Pai', 'invalid-id'),
    );
  });
});
