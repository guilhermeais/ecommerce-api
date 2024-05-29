import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';
import { UseCase } from '@/core/types/use-case';
import { Logger } from '@/shared/logger';
import { Product } from '../../enterprise/entities/product';
import { ProductsRepository } from '../gateways/repositories/products-repository';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { NullOrUndefined } from '@/core/types/deep-partial';
import { Injectable } from '@nestjs/common';

export type ListProductsRequest = PaginatedRequest<
  NullOrUndefined<{
    name: string;
    categoryId: string;
    subCategoryId: string;
  }>
>;

export type ListProductsResponse = PaginatedResponse<Product>;

@Injectable()
export class ListProductsUseCase
  implements UseCase<ListProductsRequest, ListProductsResponse>
{
  constructor(
    private readonly productRepository: ProductsRepository,
    private readonly logger: Logger,
  ) {}

  async execute(request: ListProductsRequest): Promise<ListProductsResponse> {
    try {
      this.logger.log(
        ListProductsUseCase.name,
        `Listing products with request ${JSON.stringify(request)}`,
      );
      const result = await this.productRepository.list({
        ...request,
        categoryId: request.categoryId
          ? new UniqueEntityID(request.categoryId)
          : null,
        subCategoryId: request.subCategoryId
          ? new UniqueEntityID(request.subCategoryId)
          : null,
      });

      this.logger.log(
        ListProductsUseCase.name,
        `Found ${result.total} products with ${JSON.stringify(request, null, 2)}`,
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        ListProductsUseCase.name,
        `Error on listing products with request ${JSON.stringify(request)}: ${error.message}`,
      );
      throw error;
    }
  }
}
