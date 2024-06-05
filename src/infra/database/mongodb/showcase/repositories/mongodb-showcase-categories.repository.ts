import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';
import { ShowcaseCategoriesRepository } from '@/domain/showcase/application/gateways/repositories/showcase-categoires.repository';
import { ShowcaseCategory } from '@/domain/showcase/enterprise/entities/showcase-category';
import { Logger } from '@/shared/logger';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { MongoDbShowcaseCategoriesMapper } from '../mappers/mongodb-showcase-categories-mapper';
import { MongoDbShowcaseCategoryModel } from '../schemas/showcase-category.model';

@Injectable()
export class MongoDbShowcaseCategoriesRepository
  implements ShowcaseCategoriesRepository
{
  constructor(
    @Inject(MongoDbShowcaseCategoryModel.COLLECTION_NAME)
    private readonly categoryModel: Model<MongoDbShowcaseCategoryModel>,
    private readonly logger: Logger,
  ) {}

  async list(
    request: PaginatedRequest<
      Partial<{
        name: string;
        categoryId: UniqueEntityID;
      }>
    >,
  ): Promise<PaginatedResponse<ShowcaseCategory>> {
    try {
      this.logger.log(
        MongoDbShowcaseCategoriesRepository.name,
        `Listing showcase categories with ${JSON.stringify(request)}`,
      );

      const { page, limit, name, categoryId } = request;
      const skip = (page - 1) * limit;

      const [result] = (await this.categoryModel.aggregate([
        {
          $match: {
            ...(name && { name: { $regex: name, $options: 'i' } }),
            ...(categoryId && {
              id: categoryId.toString(),
            }),
            rootCategoryId: {
              $exists: false,
            },
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
        items: MongoDbShowcaseCategoryModel[];
      }[];

      const [metadata] = result?.metadata;
      result.items = await Promise.all(
        result.items.map((c) => this.addChildrensTo(c)),
      );

      const total = metadata?.total ?? 0;
      const pages = Math.ceil(total / limit);

      this.logger.log(
        MongoDbShowcaseCategoriesRepository.name,
        `Found ${total} categories with ${JSON.stringify(request)}`,
      );
      return {
        items: result.items.map(MongoDbShowcaseCategoriesMapper.toDomain),
        total,
        pages,
        limit,
        currentPage: page,
      };
    } catch (error: any) {
      this.logger.error(
        MongoDbShowcaseCategoriesRepository.name,
        `Error listing showcase categories with ${JSON.stringify(request)}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async addChildrensTo(category: MongoDbShowcaseCategoryModel) {
    const childrenCategories = await this.categoryModel.find({
      rootCategoryId: category.id,
    });

    category.childrenCategories = childrenCategories || [];

    return category;
  }
}
