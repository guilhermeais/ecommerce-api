import { Category } from '@/domain/product/enterprise/entities/category';
import { MongoCategoryModel } from '../schemas/category.model';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export class MongoDbCategoryMapper {
  static toPersistence(category: Category): MongoCategoryModel {
    return {
      _id: category.id.toValue(),
      id: category.id.toValue(),
      name: category.name,
      description: category.description,
      rootCategoryId: category.rootCategory?.id.toValue(),
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  static toDomain(category: MongoCategoryModel): Category {
    return Category.restore(
      {
        name: category.name,
        description: category.description,
        rootCategory: category.rootCategory?.id
          ? MongoDbCategoryMapper.toDomain(category.rootCategory)
          : undefined,
      },
      new UniqueEntityID(category.id),
      category.createdAt,
      category.updatedAt,
    );
  }
}
