import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Partial } from '@/core/types/deep-partial';
import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';
import { CategoriesRepository } from '@/domain/product/application/gateways/repositories/categories-repository';
import { Category } from '@/domain/product/enterprise/entities/category';
import { EnvService } from '@/infra/env/env.service';
import { Logger } from '@/shared/logger';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { MongoDbCategoryMapper } from '../mappers/mongodb-category.mapper';
import { MongoCategoryModel } from '../schemas/category.model';

@Injectable()
export class MongoDbCategoriesRepository implements CategoriesRepository {
  constructor(
    @Inject(MongoCategoryModel.COLLECTION_NAME)
    private readonly categoryModel: Model<MongoCategoryModel>,
    private readonly env: EnvService,
    private readonly logger: Logger,
  ) {}

  async findById(id: UniqueEntityID): Promise<Category | null> {
    try {
      this.logger.log(
        MongoDbCategoriesRepository.name,
        `Finding category by id ${id.toString()}`,
      );

      const category = await this.categoryModel
        .findOne({
          id: id.toString(),
        })
        .exec();
      if (!category) {
        return null;
      }

      return MongoDbCategoryMapper.toDomain(category.toJSON());
    } catch (error: any) {
      this.logger.error(
        MongoDbCategoriesRepository.name,
        `Error finding category by id ${id.toString()}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async save(category: Category): Promise<void> {
    try {
      this.logger.log(
        MongoDbCategoriesRepository.name,
        `Saving category ${category.name}`,
      );

      const exists = await this.categoryModel.exists({
        _id: category.id.toString(),
      });

      const categoryModel = MongoDbCategoryMapper.toPersistense(category);

      if (exists) {
        this.logger.log(
          MongoDbCategoriesRepository.name,
          `Updating category ${category.id.toString()} ${category.name}`,
        );
        await this.categoryModel.updateOne(
          { _id: category.id.toString() },
          categoryModel,
        );
        return;
      }

      this.logger.log(
        MongoDbCategoriesRepository.name,
        `Creating category ${category.name}`,
      );

      await this.categoryModel.create(categoryModel);
    } catch (error: any) {
      this.logger.error(
        MongoDbCategoriesRepository.name,
        `Error saving category ${category.name}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  async list(
    request: PaginatedRequest<
      Partial<{ name: string; rootCategoryId: UniqueEntityID }>
    >,
  ): Promise<PaginatedResponse<Category>> {
    try {
      this.logger.log(
        MongoDbCategoriesRepository.name,
        `Listing categories with ${JSON.stringify(request)}`,
      );

      const { page, limit, name, rootCategoryId } = request;
      const skip = (page - 1) * limit;

      const [result] = (await this.categoryModel.aggregate([
        {
          $match: {
            ...(name && { name: { $regex: name, $options: 'i' } }),
            ...(rootCategoryId && {
              rootCategoryId: rootCategoryId.toString(),
            }),
          },
        },
        {
          $lookup: {
            from: MongoCategoryModel.COLLECTION_NAME,
            localField: 'rootCategoryId',
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
        { $sort: { createdAt: 1 } },
        {
          $facet: {
            items: [{ $skip: skip }, { $limit: limit }],
            metadata: [{ $count: 'total' }],
          },
        },
      ])) as {
        metadata: { total: number }[];
        items: MongoCategoryModel[];
      }[];

      const [metadata] = result?.metadata;

      const total = metadata?.total ?? 0;
      const pages = Math.ceil(total / limit);

      this.logger.log(
        MongoDbCategoriesRepository.name,
        `Found ${total} categories with ${JSON.stringify(request)}`,
      );
      return {
        items: result.items.map(MongoDbCategoryMapper.toDomain),
        total,
        pages,
        limit,
        currentPage: page,
      };
    } catch (error: any) {
      this.logger.error(
        MongoDbCategoriesRepository.name,
        `Error listing categories with ${JSON.stringify(request)}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    try {
      this.logger.log(
        MongoDbCategoriesRepository.name,
        `Deleting category by id ${id.toString()}`,
      );

      await this.categoryModel.deleteOne({ _id: id.toString() }).exec();

      this.logger.log(
        MongoDbCategoriesRepository.name,
        `Category by id ${id.toString()} deleted`,
      );
    } catch (error: any) {
      this.logger.error(
        MongoDbCategoriesRepository.name,
        `Error deleting category by id ${id.toString()}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async exists(id: UniqueEntityID): Promise<boolean> {
    const exists = await this.categoryModel
      .exists({ id: id.toString() })
      .exec();

    return !!exists?._id;
  }

  async clear(): Promise<void> {
    const isTesting = this.env.get('IS_TESTING');
    if (isTesting) {
      await this.categoryModel.deleteMany({}).exec();
      return;
    }

    throw new Error('You can only clear the database in testing environment');
  }
}
