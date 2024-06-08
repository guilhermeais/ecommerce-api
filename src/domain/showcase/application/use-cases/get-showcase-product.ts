import { UseCase } from '@/core/types/use-case';
import { ShowcaseProduct } from '../../enterprise/entities/showcase-product';
import { ShowcaseProductsRepository } from '../gateways/repositories/showcase-products-repository';
import { Logger } from '@/shared/logger';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { Injectable } from '@nestjs/common';

export type GetShowcaseProductRequest = {
  id: string;
};

export type GetShowcaseProductResponse = ShowcaseProduct;

@Injectable()
export class GetShowcaseProductUseCase
  implements UseCase<GetShowcaseProductRequest, GetShowcaseProductResponse>
{
  constructor(
    private readonly showcaseProductRepository: ShowcaseProductsRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    request: GetShowcaseProductRequest,
  ): Promise<GetShowcaseProductResponse> {
    try {
      this.logger.log(
        GetShowcaseProductUseCase.name,
        `Finding product by id ${request.id}`,
      );

      const id = new UniqueEntityID(request.id);

      const product = await this.showcaseProductRepository.findById(id);

      if (!product) {
        throw new EntityNotFoundError('Produto', request.id);
      }

      this.logger.log(
        GetShowcaseProductUseCase.name,
        `Product found by id ${request.id}`,
      );

      return product;
    } catch (error: any) {
      this.logger.error(
        GetShowcaseProductUseCase.name,
        `Error finding product by id ${request.id}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
