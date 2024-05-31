import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { InMemoryCategoriesRepository } from '@/infra/database/in-memory/repositories/products/in-memory-categories.repository';
import { Logger } from '@/shared/logger';
import { faker } from '@faker-js/faker';
import { makeCategory } from 'test/products/enterprise/entities/make-category';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { CategoriesRepository } from '../gateways/repositories/categories-repository';
import {
  CreateCategoryRequest,
  CreateCategoryUseCase,
} from './create-category';

describe('CreateCategoryUseCase', () => {
  let sut: CreateCategoryUseCase;
  let categoriesRepository: CategoriesRepository;
  let logger: Logger;

  beforeEach(() => {
    categoriesRepository = new InMemoryCategoriesRepository();
    logger = makeFakeLogger();
    sut = new CreateCategoryUseCase(categoriesRepository, logger);
  });

  function makeCreateCategoryRequest(
    modifications?: Partial<CreateCategoryRequest>,
  ): CreateCategoryRequest {
    return {
      name: faker.commerce.department(),
      description: faker.lorem.sentence(),
      ...modifications,
    };
  }

  it('should create a category', async () => {
    const request = makeCreateCategoryRequest();
    const response = await sut.execute(request);

    expect(response.id).toBeDefined();
    expect(response.id).toBeInstanceOf(UniqueEntityID);
    expect(response.name).toEqual(request.name);
  });

  it('should create a sub-category', async () => {
    const rootCategory = makeCategory();
    await categoriesRepository.save(rootCategory);

    const request = makeCreateCategoryRequest({
      rootCategoryId: rootCategory.id.toString(),
    });
    const response = await sut.execute(request);

    expect(response.id).toBeDefined();
    expect(response.id).toBeInstanceOf(UniqueEntityID);
    expect(response.name).toEqual(request.name);
    expect(response.rootCategory).toEqual(rootCategory);
  });

  it('should throw EntityNotFoundError if provided a sub-category does not exists', async () => {
    const request = makeCreateCategoryRequest({
      rootCategoryId: faker.string.uuid(),
    });
    await expect(sut.execute(request)).rejects.toThrowError(
      new EntityNotFoundError('Categoria Pai', request.rootCategoryId),
    );
  });
});
