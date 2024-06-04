import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Partial } from '@/core/types/deep-partial';
import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';
import { UseCase } from '@/core/types/use-case';
import { Logger } from '@/shared/logger';
import { Injectable } from '@nestjs/common';
import { ShowcaseCategory } from '../../enterprise/entities/showcase-category';
import { ShowcaseCategoriesRepository } from '../gateways/repositories/showcase-categoires.repository';

export type GetShowcaseCategoriesRequest = PaginatedRequest<
  Partial<{
    name: string;
    categoryId: string;
  }>
>;

export type GetShowcaseCategoriesResponse = PaginatedResponse<ShowcaseCategory>;

@Injectable()
export class GetShowcaseCategoriesUseCase
  implements
    UseCase<GetShowcaseCategoriesRequest, GetShowcaseCategoriesResponse>
{
  constructor(
    private readonly showcaseCategoriesRepository: ShowcaseCategoriesRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    request: GetShowcaseCategoriesRequest,
  ): Promise<GetShowcaseCategoriesResponse> {
    try {
      this.logger.log(
        GetShowcaseCategoriesUseCase.name,
        `Getting showcase categories with request: ${JSON.stringify(request)}`,
      );

      const result = await this.showcaseCategoriesRepository.list({
        ...request,
        name: request.name,
        categoryId: request.categoryId
          ? new UniqueEntityID(request.categoryId)
          : null,
      });

      this.logger.log(
        GetShowcaseCategoriesUseCase.name,
        `Found ${result.total} showcase categories.`,
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        GetShowcaseCategoriesUseCase.name,
        `Error while getting showcase categories with ${JSON.stringify(
          request,
          null,
          2,
        )}: ${error.message}`,
      );

      throw error;
    }
  }
}
