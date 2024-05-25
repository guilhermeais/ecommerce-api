import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { EventManager, Events } from '@/core/types/events';
import { UseCase } from '@/core/types/use-case';
import { Logger } from '@/shared/logger';
import { Product } from '../../enterprise/entities/product';
import { ProductsRepository } from '../gateways/repositories/products-repository';
import { File } from '../gateways/storage/file';
import { StorageGateway } from '../gateways/storage/storage-gateway';
import { Injectable } from '@nestjs/common';

export type CreateProductRequest = {
  name: string;
  description: string;
  price: number;
  isShown: boolean;
  subCategoryId: string;
  image: File;
};

export type CreateProductResponse = Product;

@Injectable()
export class CreateProductUseCase
  implements UseCase<CreateProductRequest, CreateProductResponse>
{
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly storageGateway: StorageGateway,
    private readonly logger: Logger,
    private readonly eventManager: EventManager,
  ) {}

  async execute(request: CreateProductRequest): Promise<Product> {
    try {
      this.logger.log(
        CreateProductUseCase.name,
        `Creating product ${request.name} - ${request.price}`,
      );

      this.logger.debug(
        CreateProductUseCase.name,
        `Create product ${request.name} - ${request.price}: ${JSON.stringify(request, null, 2)}`,
      );

      const imageUrl = await this.uploadProductImage(request);

      const subCategoryId = new UniqueEntityID(request.subCategoryId);

      const product = Product.create({
        name: request.name,
        description: request.description,
        price: request.price,
        isShown: request.isShown,
        subCategoryId,
        image: imageUrl,
      });

      await this.productsRepository.save(product);

      this.logger.log(
        CreateProductUseCase.name,
        `Product ${request.name} - ${request.price} created!`,
      );

      await this.eventManager.publish(Events.PRODUCT_CREATED, product);

      return product;
    } catch (error: any) {
      this.logger.error(
        CreateProductUseCase.name,
        `Error on creating product ${request.name} - ${request.price}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  private async uploadProductImage(
    request: CreateProductRequest,
  ): Promise<string | undefined> {
    if (!request.image) {
      return undefined;
    }

    this.logger.log(
      CreateProductUseCase.name,
      `Uploading image for product ${request.name} - ${request.price}`,
    );

    try {
      const image = await this.storageGateway.upload(request.image);

      this.logger.debug(
        CreateProductUseCase.name,
        `Image uploaded for product ${request.name} - ${request.price}! URL: ${image.url}`,
      );

      return image.url;
    } catch (error: any) {
      this.logger.error(
        CreateProductUseCase.name,
        `Error on uploading image for product ${request.name} - ${request.price}: ${error.message}`,
        error.stack,
      );

      return undefined;
    }
  }
}
