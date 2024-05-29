import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { BadRequestError } from '@/core/errors/commom/bad-request.error';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { UseCase } from '@/core/types/use-case';
import { Logger } from '@/shared/logger';
import { Product } from '../../enterprise/entities/product';
import { ProductsRepository } from '../gateways/repositories/products-repository';

export type GetProductByIdRequest = {
  id: string;
};

export type GetProductByIdResponse = Product;

export class GetProductByIdUseCase
  implements UseCase<GetProductByIdRequest, GetProductByIdResponse>
{
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    request: GetProductByIdRequest,
  ): Promise<GetProductByIdResponse> {
    try {
      if (!request.id) {
        throw new BadRequestError('Id do produto é obrigatório.');
      }

      this.logger.log(
        GetProductByIdUseCase.name,
        `Getting product with ID ${request.id}`,
      );
      const product = await this.productsRepository.findById(
        new UniqueEntityID(request.id),
      );

      if (!product) {
        throw new EntityNotFoundError('Produto', request.id);
      }

      this.logger.log(
        GetProductByIdUseCase.name,
        `Found product with ID ${request.id}: ${product.name}`,
      );

      return product;
    } catch (error: any) {
      this.logger.error(
        GetProductByIdUseCase.name,
        `Error on getting product with ID ${request.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
