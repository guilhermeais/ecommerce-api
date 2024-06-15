import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Partial } from '@/core/types/deep-partial';
import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';
import { ProductsRepository } from '@/domain/product/application/gateways/repositories/products-repository';
import { Product } from '@/domain/product/enterprise/entities/product';
import { EnvService } from '@/infra/env/env.service';
import { Logger } from '@/shared/logger';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { MongoDbProductMapper } from '../mappers/mongodb-product.mapper';
import { MongoProductModel } from '../schemas/product.model';
import { MongoCategoryModel } from '../schemas/category.model';
import { MongoAdministratorModel } from '../schemas/administrator.model';

@Injectable()
export class MongoDbProductsRepository implements ProductsRepository {
  constructor(
    @Inject(MongoProductModel.COLLECTION_NAME)
    private readonly productModel: Model<MongoProductModel>,
    private readonly env: EnvService,
    private readonly logger: Logger,
  ) {}

  async save(product: Product): Promise<void> {
    try {
      this.logger.log(
        MongoDbProductsRepository.name,
        `Saving product ${product.name}`,
      );

      const exists = await this.productModel.exists({
        id: product.id.toString(),
      });

      const productModel = MongoDbProductMapper.toPersistence(product);

      if (exists) {
        await this.productModel.updateOne(
          {
            _id: product.id.toString(),
          },
          productModel,
        );
      } else {
        await this.productModel.create(productModel);
      }

      this.logger.log(
        MongoDbProductsRepository.name,
        `Product ${product.name} saved`,
      );
    } catch (error: any) {
      this.logger.error(
        MongoDbProductsRepository.name,
        `Error saving product ${product.name}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findById(id: UniqueEntityID): Promise<Product | null> {
    try {
      this.logger.log(
        MongoDbProductsRepository.name,
        `Finding product by id ${id.toString()}`,
      );

      const [product] = (await this.productModel.aggregate([
        {
          $match: {
            id: id.toString(),
          },
        },
        {
          $lookup: {
            from: MongoCategoryModel.COLLECTION_NAME,
            localField: 'subCategoryId',
            foreignField: 'id',
            as: 'subCategory',
          },
        },
        {
          $unwind: {
            path: '$subCategory',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: MongoCategoryModel.COLLECTION_NAME,
            localField: 'subCategory.rootCategoryId',
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
            from: MongoAdministratorModel.COLLECTION_NAME,
            localField: 'createdById',
            foreignField: 'id',
            as: 'createdBy',
          },
        },
        {
          $unwind: {
            path: '$createdBy',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: MongoAdministratorModel.COLLECTION_NAME,
            localField: 'updatedById',
            foreignField: 'id',
            as: 'updatedBy',
          },
        },
        {
          $unwind: {
            path: '$updatedBy',
            preserveNullAndEmptyArrays: true,
          },
        },
      ])) as MongoProductModel[];

      if (!product) {
        this.logger.log(
          MongoDbProductsRepository.name,
          `Product ${id.toString()} not found`,
        );
        return null;
      }

      this.logger.log(
        MongoDbProductsRepository.name,
        `Product ${id.toString()} - ${product.name} found`,
      );

      return MongoDbProductMapper.toDomain(product);
    } catch (error: any) {
      this.logger.error(
        MongoDbProductsRepository.name,
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
  ): Promise<PaginatedResponse<Product>> {
    try {
      this.logger.log(
        MongoDbProductsRepository.name,
        `Listing products with ${JSON.stringify(request)}`,
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
          },
        },
        {
          $lookup: {
            from: MongoCategoryModel.COLLECTION_NAME,
            localField: 'subCategoryId',
            foreignField: 'id',
            as: 'subCategory',
          },
        },
        {
          $unwind: {
            path: '$subCategory',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: MongoCategoryModel.COLLECTION_NAME,
            localField: 'subCategory.rootCategoryId',
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
            'subCategory.rootCategory': '$rootCategory',
          },
        },
        {
          $match: {
            ...(categoryId && {
              'rootCategory.id': categoryId.toString(),
            }),
          },
        },
        {
          $lookup: {
            from: MongoAdministratorModel.COLLECTION_NAME,
            localField: 'createdById',
            foreignField: 'id',
            as: 'createdBy',
          },
        },
        {
          $unwind: {
            path: '$createdBy',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: MongoAdministratorModel.COLLECTION_NAME,
            localField: 'updatedById',
            foreignField: 'id',
            as: 'updatedBy',
          },
        },
        {
          $unwind: {
            path: '$updatedBy',
            preserveNullAndEmptyArrays: true,
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
        items: MongoProductModel[];
      }[];

      const [metadata] = result?.metadata;

      const total = metadata?.total ?? 0;
      const pages = Math.ceil(total / limit);

      this.logger.log(
        MongoDbProductsRepository.name,
        `Found ${total} products with ${JSON.stringify(request)}`,
      );
      return {
        items: result.items.map(MongoDbProductMapper.toDomain),
        total,
        pages,
        limit,
        currentPage: page,
      };
    } catch (error: any) {
      this.logger.error(
        MongoDbProductsRepository.name,
        `Error listing products with ${JSON.stringify(request)}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async clear(): Promise<void> {
    const isTesting = this.env.get('IS_TESTING');
    if (isTesting) {
      await this.productModel.deleteMany({}).exec();
      return;
    }

    throw new Error('You can only clear the database in testing environment');
  }
}
