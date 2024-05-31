import { Partial } from '@/core/types/deep-partial';
import { UseCase } from '@/core/types/use-case';
import { Logger } from '@/shared/logger';
import { CategoriesRepository } from '../gateways/repositories/categories-repository';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { Injectable } from '@nestjs/common';

export type UpdateCategoryRequest = {
  id: string;
} & Partial<{
  name?: string;
  description?: string;
}>;

export type UpdateCategoryResponse = void;

@Injectable()
export class UpdateCategoryUseCase
  implements UseCase<UpdateCategoryRequest, UpdateCategoryResponse>
{
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    request: UpdateCategoryRequest,
  ): Promise<UpdateCategoryResponse> {
    try {
      this.logger.log(
        UpdateCategoryUseCase.name,
        `Updating category ${request.id} with ${JSON.stringify(request, null, 2)}`,
      );

      const { id, ...rest } = request;

      const category = await this.categoriesRepository.findById(
        new UniqueEntityID(id),
      );

      if (!category) {
        throw new EntityNotFoundError('Categoria', id);
      }

      Object.assign(category, rest);

      await this.categoriesRepository.save(category);

      this.logger.log(
        UpdateCategoryUseCase.name,
        `Category ${request.id} updated successfully with ${JSON.stringify(
          request,
          null,
          2,
        )}`,
      );
    } catch (error: any) {
      this.logger.error(
        UpdateCategoryUseCase.name,
        `Error updating category ${request.id} with ${JSON.stringify(request, null, 2)}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
