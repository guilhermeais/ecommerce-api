import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { EventManager, Events } from '@/core/types/events';
import { UseCase } from '@/core/types/use-case';
import { Logger } from '@/shared/logger';
import { Injectable } from '@nestjs/common';
import { Category } from '../../enterprise/entities/category';
import { Product } from '../../enterprise/entities/product';
import {
  Administrator,
  AdministratorProps,
} from '../../enterprise/entities/responsable';
import { CategoriesRepository } from '../gateways/repositories/categories-repository';
import { ProductsRepository } from '../gateways/repositories/products-repository';
import { File } from '../gateways/storage/file';
import { StorageGateway } from '../gateways/storage/storage-gateway';

export type CreateProductRequest = {
  name: string;
  description?: string;
  price: number;
  isShown?: boolean;
  subCategoryId?: string;
  image?: File;
  createdBy: AdministratorProps;
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
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  async execute(request: CreateProductRequest): Promise<Product> {
    try {
      this.logger.log(
        CreateProductUseCase.name,
        `Creating product ${request.name} - ${request.price}`,
      );

      this.logger.debug(
        CreateProductUseCase.name,
        `Create product ${request.name} - ${request.price}: ${JSON.stringify(
          {
            ...request,
            image: '***',
          },
          null,
          2,
        )}`,
      );

      const imageUrl = await this.uploadProductImage(request);

      let subCategory: Category | undefined | null = undefined;

      if (request.subCategoryId) {
        subCategory = await this.categoriesRepository.findById(
          new UniqueEntityID(request.subCategoryId),
        );

        if (!subCategory) {
          throw new EntityNotFoundError('Categoria', request.subCategoryId);
        }
      }

      const createdBy = Administrator.restore(
        request.createdBy,
        request.createdBy!.id!,
      );

      const product = Product.create({
        name: request.name,
        description: request.description,
        price: request.price,
        isShown: request.isShown,
        subCategory,
        image: imageUrl,
        createdBy,
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
