import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import {
  ShowcaseProductCategory,
  ShowcaseProduct,
} from '@/domain/showcase/enterprise/entities/showcase-product';
import {
  ShowcaseProductCategoryModel,
  ShowcaseProductModel,
} from '@/infra/database/mongodb/showcase/schemas/showcase-product.model';

export class MongoDbShowcaseProductsMapper {
  static toDomain(model: ShowcaseProductModel): ShowcaseProduct {
    return ShowcaseProduct.restore(
      {
        name: model.name,
        description: model.description,
        price: model.price,
        image: model.image,
        category:
          model?.category &&
          MongoDbShowcaseProductsMapper.categoryToDomain(model.category),
      },
      new UniqueEntityID(model.id),
      model.createdAt,
      model.updatedAt,
    );
  }

  private static categoryToDomain(
    categoryModel: ShowcaseProductCategoryModel,
  ): ShowcaseProductCategory {
    return {
      id: new UniqueEntityID(categoryModel.id),
      name: categoryModel.name,
      description: categoryModel.description,
      rootCategory: categoryModel?.rootCategory && {
        id: new UniqueEntityID(categoryModel.rootCategory.id),
        name: categoryModel.rootCategory.name,
        description: categoryModel.rootCategory.description,
        createdAt: categoryModel.rootCategory.createdAt,
        updatedAt: categoryModel.rootCategory.updatedAt,
      },
      createdAt: categoryModel.createdAt,
      updatedAt: categoryModel.updatedAt,
    };
  }
}
