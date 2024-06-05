import { ShowcaseCategory } from '@/domain/showcase/enterprise/entities/showcase-category';
import { MongoDbShowcaseCategoryModel } from '../schemas/showcase-category.model';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export class MongoDbShowcaseCategoriesMapper {
  static toDomain(model: MongoDbShowcaseCategoryModel): ShowcaseCategory {
    return ShowcaseCategory.restore(
      {
        name: model.name,
        childrenCategories: model.childrenCategories?.map(
          MongoDbShowcaseCategoriesMapper.mapFamiliarCategory,
        ),
        rootCategory:
          model.rootCategory &&
          MongoDbShowcaseCategoriesMapper.mapFamiliarCategory(
            model.rootCategory,
          ),
        description: model.description,
      },
      new UniqueEntityID(model.id),
      model.createdAt,
      model.updatedAt,
    );
  }

  private static mapFamiliarCategory(model: MongoDbShowcaseCategoryModel) {
    return ShowcaseCategory.restore(
      {
        name: model.name,
        description: model.description,
      },
      new UniqueEntityID(model.id),
      model.createdAt,
      model.updatedAt,
    );
  }
}
