import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { InMemoryCategoriesRepository } from '@/infra/database/in-memory/repositories/products/in-memory-categories.repository';
import { Logger } from '@/shared/logger';
import { faker } from '@faker-js/faker';
import { makeCategory } from 'test/products/enterprise/entities/make-category';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { CategoriesRepository } from '../gateways/repositories/categories-repository';
import {
  UpdateCategoryRequest,
  UpdateCategoryUseCase,
} from './update-category';

describe('UpdateCategoryUseCase', () => {
  let sut: UpdateCategoryUseCase;
  let categoriesRepository: CategoriesRepository;
  let logger: Logger;

  beforeEach(() => {
    categoriesRepository = new InMemoryCategoriesRepository();
    logger = makeFakeLogger();
    sut = new UpdateCategoryUseCase(categoriesRepository, logger);
  });

  function makeUpdateCategoryRequest(
    modifications?: Partial<UpdateCategoryRequest>,
  ): UpdateCategoryRequest {
    return {
      id: faker.string.uuid(),
      description: faker.lorem.sentence(),
      name: faker.commerce.department(),
      ...modifications,
    };
  }

  it('should update the name of an existing category', async () => {
    const existingCategory = makeCategory();
    await categoriesRepository.save(existingCategory);

    const request = makeUpdateCategoryRequest({
      id: existingCategory.id.toString(),
      name: 'Updated',
    });

    await sut.execute(request);

    const updatedCategory = await categoriesRepository.findById(
      existingCategory.id,
    );

    expect(updatedCategory).toBeDefined();
    expect(updatedCategory?.name).toEqual(request.name);
    expect(updatedCategory?.description).toEqual(existingCategory.description);
  });

  it('should update the description of an existing category', async () => {
    const existingCategory = makeCategory();
    await categoriesRepository.save(existingCategory);

    const request = makeUpdateCategoryRequest({
      id: existingCategory.id.toString(),
      description: 'Updated',
    });

    await sut.execute(request);

    const updatedCategory = await categoriesRepository.findById(
      existingCategory.id,
    );

    expect(updatedCategory).toBeDefined();
    expect(updatedCategory?.description).toEqual(request.description);
    expect(updatedCategory?.name).toEqual(existingCategory.name);
  });

  it('should throw if the category does not exists', async () => {
    const request = makeUpdateCategoryRequest();

    await expect(sut.execute(request)).rejects.toThrow(
      new EntityNotFoundError('Categoria', request.id),
    );
  });
});
