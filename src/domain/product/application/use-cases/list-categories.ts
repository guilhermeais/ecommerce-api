import { Partial } from '@/core/types/deep-partial';
import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';
import { UseCase } from '@/core/types/use-case';
import { Logger } from '@/shared/logger';
import { Injectable } from '@nestjs/common';
import { Category } from '../../enterprise/entities/category';
import { CategoriesRepository } from '../gateways/repositories/categories-repository';

export type ListCategoriesRequest = PaginatedRequest<
  Partial<{
    name: string;
    rootCategoryId: string;
  }>
>;

export type ListCategoriesResponse = PaginatedResponse<Category>;

@Injectable()
export class ListCategoriesUseCase
  implements UseCase<ListCategoriesRequest, ListCategoriesResponse>
{
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    request: ListCategoriesRequest,
  ): Promise<ListCategoriesResponse> {
    try {
      this.logger.log(
        ListCategoriesUseCase.name,
        `Listing categories with: ${JSON.stringify(request)}.`,
      );

      const result = await this.categoriesRepository.list(request);

      this.logger.log(
        ListCategoriesUseCase.name,
        `Found ${result.total} categories with: ${JSON.stringify(request)}.`,
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        ListCategoriesUseCase.name,
        `Error listing categories with: ${JSON.stringify(request)}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
