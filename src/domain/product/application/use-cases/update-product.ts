import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { NullOrUndefined, Partial } from '@/core/types/deep-partial';
import { EventManager, Events } from '@/core/types/events';
import { UseCase } from '@/core/types/use-case';
import { Logger } from '@/shared/logger';
import { Injectable } from '@nestjs/common';
import {
  Administrator,
  AdministratorProps,
} from '../../enterprise/entities/administrator';
import { CategoriesRepository } from '../gateways/repositories/categories-repository';
import { ProductsRepository } from '../gateways/repositories/products-repository';
import { File } from '../gateways/storage/file';
import { StorageGateway } from '../gateways/storage/storage-gateway';
import { Category } from '../../enterprise/entities/category';

export type UpdateProductRequest = {
  id: string;
  updatedBy: AdministratorProps;
} & Partial<{
  name: string;
  description: string;
  price: number;
  isShown: boolean;
  subCategoryId?: string;
  image?: File;
}>;

export type UpdateProductResponse = void;

@Injectable()
export class UpdateProductUseCase
  implements UseCase<UpdateProductRequest, UpdateProductResponse>
{
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly storageGateway: StorageGateway,
    private readonly logger: Logger,
    private readonly eventManager: EventManager,
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  async execute(request: UpdateProductRequest): Promise<UpdateProductResponse> {
    try {
      const {
        id,
        image: newImage,
        subCategoryId: newSubCategoryId,
        ...restOfRequest
      } = request;

      this.logger.log(
        UpdateProductUseCase.name,
        `Updating product ${request.id} ${request.name}`,
      );

      this.logger.debug(
        UpdateProductUseCase.name,
        `Update product ${request.id} ${request.name}: ${JSON.stringify(
          {
            ...request,
            image: '***',
          },
          null,
          2,
        )}`,
      );

      const product = await this.productsRepository.findById(
        new UniqueEntityID(id),
      );

      if (!product) {
        throw new EntityNotFoundError('Produto', request.id);
      }

      if (newSubCategoryId !== undefined) {
        this.logger.log(
          UpdateProductUseCase.name,
          `Updating product ${request.id} ${request.name} with new subcategory ${newSubCategoryId}`,
        );
        let newCategory: NullOrUndefined<Category> = null;

        if (newSubCategoryId) {
          newCategory = await this.categoriesRepository.findById(
            new UniqueEntityID(newSubCategoryId),
          );

          if (!newCategory) {
            this.logger.log(
              UpdateProductUseCase.name,
              `Product ${request.id} ${request.name} updated with new subcategory ${newSubCategoryId}`,
            );
            throw new EntityNotFoundError('Categoria', newSubCategoryId);
          }
        }

        product.subCategory = newCategory;

        this.logger.log(
          UpdateProductUseCase.name,
          `Product ${request.id} ${request.name} updated with new subcategory ${newSubCategoryId}`,
        );
      }

      if (newImage) {
        this.logger.log(
          UpdateProductUseCase.name,
          `Updating product ${request.id} ${request.name} with new image`,
        );
        const { url: newImageUrl } = await this.storageGateway.upload(newImage);
        const oldImageUrl = product.image;

        if (oldImageUrl) {
          this.logger.log(
            UpdateProductUseCase.name,
            `Deleting old image of product ${request.id} - ${request.name} `,
          );
          await this.storageGateway
            .delete(oldImageUrl)
            .catch((err) =>
              this.logger.error(
                UpdateProductUseCase.name,
                `Error deleting old image of product ${request.id} - ${request.name}: ${err.message}`,
                err.stack,
              ),
            );
        }

        product.image = newImageUrl;

        this.logger.log(
          UpdateProductUseCase.name,
          `Product ${request.id} ${request.name} updated with new image`,
        );
      }

      Object.assign(product, restOfRequest);

      product.updatedBy = Administrator.restore(
        request.updatedBy,
        request.updatedBy!.id!,
      );

      await this.productsRepository.save(product);

      await this.eventManager.publish(Events.PRODUCT_UPDATED, product);

      this.logger.log(
        UpdateProductUseCase.name,
        `Product ${request.id} ${request.name} updated with ${JSON.stringify(restOfRequest, null, 2)}`,
      );
    } catch (error: any) {
      this.logger.error(
        UpdateProductUseCase.name,
        `Error updating product ${request.id} - ${request.name}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
