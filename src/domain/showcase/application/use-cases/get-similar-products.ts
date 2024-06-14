import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { UseCase } from '@/core/types/use-case';
import { Logger } from '@/shared/logger';
import { Injectable } from '@nestjs/common';
import { ShowcaseProduct } from '../../enterprise/entities/showcase-product';
import { ProductSimilarityModelGateway } from '../gateways/gateways/product-similarity-model-gateway';
import { ShowcaseProductsRepository } from '../gateways/repositories/showcase-products-repository';

export type GetSimilarProductsRequest = {
  productId: string;
};

export type GetSimilarProductsResponse = {
  products: ShowcaseProduct[];
};

@Injectable()
export class GetSimilarProductsUseCase
  implements UseCase<GetSimilarProductsRequest, GetSimilarProductsResponse>
{
  constructor(
    private readonly productSimilarityModel: ProductSimilarityModelGateway,
    private readonly showcaseProductsRepository: ShowcaseProductsRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    request: GetSimilarProductsRequest,
  ): Promise<GetSimilarProductsResponse> {
    try {
      this.logger.log(
        GetSimilarProductsUseCase.name,
        `Finding similar products for product ${request.productId}`,
      );

      const productExists = await this.showcaseProductsRepository.exists(
        new UniqueEntityID(request.productId),
      );

      if (!productExists) {
        throw new EntityNotFoundError('Produto', request.productId);
      }

      const similarProductIds = await this.productSimilarityModel.predict(
        new UniqueEntityID(request.productId),
      );

      const similarProducts =
        await this.showcaseProductsRepository.findByIds(similarProductIds);

      this.logger.log(
        GetSimilarProductsUseCase.name,
        `Found ${similarProducts.length} similar products for product ${request.productId}: ${JSON.stringify(similarProducts, null, 2)}`,
      );

      return {
        products: similarProducts,
      };
    } catch (error: any) {
      this.logger.error(
        GetSimilarProductsUseCase.name,
        `Error finding similar products for product ${request.productId}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
