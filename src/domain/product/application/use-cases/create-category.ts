import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { UseCase } from '@/core/types/use-case';
import { Logger } from '@/shared/logger';
import { Category } from '../../enterprise/entities/category';
import { CategoriesRepository } from '../gateways/repositories/categories-repository';
import { Injectable } from '@nestjs/common';

export type CreateCategoryRequest = {
  name: string;
  description?: string;
  rootCategoryId?: string;
};

export type CreateCategoryResponse = Category;

@Injectable()
export class CreateCategoryUseCase
  implements UseCase<CreateCategoryRequest, CreateCategoryResponse>
{
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly logger: Logger,
  ) {}

  async execute(request: CreateCategoryRequest): Promise<Category> {
    try {
      this.logger.log(
        CreateCategoryUseCase.name,
        `Creating category with: ${JSON.stringify(request, null, 2)}`,
      );

      let rootCategory: Category | undefined;

      if (request.rootCategoryId) {
        const category = await this.categoriesRepository.findById(
          new UniqueEntityID(request.rootCategoryId),
        );

        if (!category) {
          throw new EntityNotFoundError(
            'Categoria Pai',
            request.rootCategoryId,
          );
        }

        rootCategory = category;
      }

      const category = Category.create({
        name: request.name,
        rootCategory,
        description: request.description,
      });

      await this.categoriesRepository.save(category);

      this.logger.log(
        CreateCategoryUseCase.name,
        `Category with ${JSON.stringify(request, null, 2)} created: ${category.id.toString()}`,
      );

      return category;
    } catch (error: any) {
      this.logger.error(
        CreateCategoryUseCase.name,
        `Error on creating category with ${JSON.stringify(request, null, 2)}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
