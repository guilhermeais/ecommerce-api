import { UniqueEntityID } from '@/core/entities/unique-entity-id';

import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';
import { ShowcaseProductsRepository } from '@/domain/showcase/application/gateways/repositories/showcase-products-repository';
import { ShowcaseProduct } from '@/domain/showcase/enterprise/entities/showcase-product';
import { ShowcaseProductModel } from '@/infra/storage/schemas/showcase-product.model';
import { Logger } from '@/shared/logger';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { MongoCategoryModel } from '../../products/schemas/category.model';
import { MongoDbShowcaseProductsMapper } from '../mappers/mongodb-showcase-product.mapper';

@Injectable()
export class MongoDbShowcaseProductsRepository
  implements ShowcaseProductsRepository
{
  constructor(
    @Inject(ShowcaseProductModel.COLLECTION_NAME)
    private readonly productModel: Model<ShowcaseProductModel>,
    private readonly logger: Logger,
  ) {}

  async findById(id: UniqueEntityID): Promise<ShowcaseProduct | null> {
    try {
      this.logger.log(
        MongoDbShowcaseProductsRepository.name,
        `Finding product by id ${id.toString()}`,
      );

      const [product] = (await this.productModel.aggregate([
        {
          $match: {
            id: id.toString(),
            isShown: true,
          },
        },
        {
          $lookup: {
            from: MongoCategoryModel.COLLECTION_NAME,
            localField: 'subCategoryId',
            foreignField: 'id',
            as: 'category',
          },
        },
        {
          $unwind: {
            path: '$category',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: MongoCategoryModel.COLLECTION_NAME,
            localField: 'category.rootCategoryId',
            foreignField: 'id',
            as: 'rootCategory',
          },
        },
        {
          $unwind: {
            path: '$rootCategory',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            'category.rootCategory': '$rootCategory',
          },
        },
      ])) as ShowcaseProductModel[];

      if (!product) {
        this.logger.log(
          MongoDbShowcaseProductsRepository.name,
          `Product ${id.toString()} not found`,
        );
        return null;
      }

      this.logger.log(
        MongoDbShowcaseProductsRepository.name,
        `Product ${id.toString()} - ${product.name} found`,
      );

      return MongoDbShowcaseProductsMapper.toDomain(product);
    } catch (error: any) {
      this.logger.error(
        MongoDbShowcaseProductsRepository.name,
        `Error finding product by id ${id.toString()}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async list(
    request: PaginatedRequest<
      Partial<{
        name: string;
        categoryId: UniqueEntityID;
        subCategoryId: UniqueEntityID;
      }>
    >,
  ): Promise<PaginatedResponse<ShowcaseProduct>> {
    try {
      this.logger.log(
        MongoDbShowcaseProductsRepository.name,
        `Listing showcase products with ${JSON.stringify(request)}`,
      );

      const { page, limit, name, categoryId, subCategoryId } = request;
      const skip = (page - 1) * limit;

      const [result] = (await this.productModel.aggregate([
        {
          $match: {
            ...(name && { name: { $regex: name, $options: 'i' } }),
            ...(subCategoryId && {
              subCategoryId: subCategoryId.toString(),
            }),
            isShown: true,
          },
        },
        {
          $lookup: {
            from: MongoCategoryModel.COLLECTION_NAME,
            localField: 'subCategoryId',
            foreignField: 'id',
            as: 'category',
          },
        },
        {
          $unwind: {
            path: '$category',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: MongoCategoryModel.COLLECTION_NAME,
            localField: 'category.rootCategoryId',
            foreignField: 'id',
            as: 'rootCategory',
          },
        },
        {
          $unwind: {
            path: '$rootCategory',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            'category.rootCategory': '$rootCategory',
          },
        },
        {
          $match: {
            ...(categoryId && {
              'rootCategory.id': categoryId.toString(),
            }),
          },
        },
        { $sort: { createdAt: 1 } },
        {
          $facet: {
            items: [{ $skip: skip }, { $limit: limit }],
            metadata: [{ $count: 'total' }],
          },
        },
      ])) as {
        metadata: { total: number }[];
        items: ShowcaseProductModel[];
      }[];

      const [metadata] = result?.metadata;

      const total = metadata?.total ?? 0;
      const pages = Math.ceil(total / limit);

      this.logger.log(
        MongoDbShowcaseProductsRepository.name,
        `Found ${total} products with ${JSON.stringify(request)}`,
      );
      return {
        items: result.items.map(MongoDbShowcaseProductsMapper.toDomain),
        total,
        pages,
        limit,
        currentPage: page,
      };
    } catch (error: any) {
      this.logger.error(
        MongoDbShowcaseProductsRepository.name,
        `Error listing showcase products with ${JSON.stringify(request)}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
