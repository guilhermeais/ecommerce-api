import { Partial } from '@/core/types/deep-partial';
import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';
import { UseCase } from '@/core/types/use-case';
import { Logger } from '@/shared/logger';
import { ShowcaseProduct } from '../../enterprise/entities/showcase-product';
import { ShowcaseProductRepository } from '../gateways/repositories/showcase-products-repository';
import { Injectable } from '@nestjs/common';

export type GetShowcaseProductsRequest = PaginatedRequest<
  Partial<{
    name: string;
    categoryId: string;
    subCategoryId: string;
  }>
>;

export type GetShowcaseProductsResponse = PaginatedResponse<ShowcaseProduct>;

@Injectable()
export class GetShowcaseProductsUseCase
  implements UseCase<GetShowcaseProductsRequest, GetShowcaseProductsResponse>
{
  constructor(
    private readonly showcaseProductRepository: ShowcaseProductRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    request: GetShowcaseProductsRequest,
  ): Promise<GetShowcaseProductsResponse> {
    try {
      this.logger.log(
        GetShowcaseProductsUseCase.name,
        `Getting showcase products with request: ${JSON.stringify(request)}`,
      );

      const result = await this.showcaseProductRepository.list(request);

      this.logger.log(
        GetShowcaseProductsUseCase.name,
        `Found ${result.total} showcase products.`,
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        GetShowcaseProductsUseCase.name,
        `Error while getting showcase products with ${JSON.stringify(request, null, 2)}: ${error.message}`,
      );

      throw error;
    }
  }
}
