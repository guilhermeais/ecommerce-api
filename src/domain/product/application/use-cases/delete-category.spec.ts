import { Logger } from '@/shared/logger';
import { CategoriesRepository } from '../gateways/repositories/categories-repository';
import {
  DeleteCategoryRequest,
  DeleteCategoryUseCase,
} from './delete-category';
import { InMemoryCategoriesRepository } from '@/infra/database/in-memory/repositories/products/in-memory-categories.repository';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { faker } from '@faker-js/faker';
import { makeCategory } from 'test/products/enterprise/entities/make-category';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';

describe('DeleteCategoryUseCase', () => {
  let sut: DeleteCategoryUseCase;
  let categoriesRepository: CategoriesRepository;
  let logger: Logger;

  beforeEach(() => {
    categoriesRepository = new InMemoryCategoriesRepository();
    logger = makeFakeLogger();

    sut = new DeleteCategoryUseCase(categoriesRepository, logger);
  });

  function makeDeleteCategoryRequest(
    modifications?: Partial<DeleteCategoryRequest>,
  ): DeleteCategoryRequest {
    return {
      id: faker.string.uuid(),
      ...modifications,
    };
  }

  it('should throw EntityNotFoundError if the category does not exists', async () => {
    const request = makeDeleteCategoryRequest();

    await expect(sut.execute(request)).rejects.toThrowError(
      new EntityNotFoundError('Categoria', request.id),
    );
  });

  it('should delete and existing category', async () => {
    const existingCategory = makeCategory();
    await categoriesRepository.save(existingCategory);

    const request = makeDeleteCategoryRequest({
      id: existingCategory.id.toString(),
    });

    await sut.execute(request);

    const category = await categoriesRepository.findById(existingCategory.id);

    expect(category).toBeNull();
  });
});
