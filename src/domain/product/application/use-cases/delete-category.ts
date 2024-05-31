import { UseCase } from '@/core/types/use-case';
import { CategoriesRepository } from '../gateways/repositories/categories-repository';
import { Logger } from '@/shared/logger';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Injectable } from '@nestjs/common';

export type DeleteCategoryRequest = {
  id: string;
};

export type DeleteCategoryResponse = void;

@Injectable()
export class DeleteCategoryUseCase
  implements UseCase<DeleteCategoryRequest, DeleteCategoryResponse>
{
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    request: DeleteCategoryRequest,
  ): Promise<DeleteCategoryResponse> {
    try {
      this.logger.log(
        DeleteCategoryUseCase.name,
        `Deleting category with id: ${request.id}.`,
      );
      const exists = await this.categoriesRepository.exists(
        new UniqueEntityID(request.id),
      );

      if (!exists) {
        throw new EntityNotFoundError('Categoria', request.id);
      }

      await this.categoriesRepository.delete(new UniqueEntityID(request.id));

      this.logger.log(
        DeleteCategoryUseCase.name,
        `Deleted category with id: ${request.id}.`,
      );
    } catch (error: any) {
      this.logger.error(
        DeleteCategoryUseCase.name,
        `Error deleting category with id: ${request.id}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
