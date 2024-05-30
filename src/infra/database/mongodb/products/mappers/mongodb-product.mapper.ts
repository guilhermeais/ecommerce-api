import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Product } from '@/domain/product/enterprise/entities/product';
import { MongoProductModel } from '../schemas/product.model';
import { MongoDbAdministratorMapper } from './mongodb-administrator.mapper';
import { MongoDbCategoryMapper } from './mongodb-category.mapper';

export class MongoDbProductMapper {
  static toPersistence(product: Product): MongoProductModel {
    return {
      _id: product.id.toString(),
      id: product.id.toString(),
      createdById: product.createdBy.id.toString(),
      name: product.name,
      price: product.price,
      description: product.description,
      image: product.image,
      isShown: product.isShown,
      subCategoryId: product.subCategory?.id?.toString() ?? null,
      updatedById: product.updatedBy?.id?.toString(),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  static toDomain(product: MongoProductModel): Product {
    return Product.restore(
      {
        name: product.name,
        price: product.price,
        description: product.description,
        image: product.image,
        isShown: product.isShown,
        subCategory: product.subCategory
          ? MongoDbCategoryMapper.toDomain(product.subCategory)
          : null,
        createdBy: MongoDbAdministratorMapper.toDomain(product!.createdBy!),
        updatedBy: product.updatedBy
          ? MongoDbAdministratorMapper.toDomain(product.updatedBy)
          : null,
      },
      new UniqueEntityID(product.id),
      product.createdAt,
      product.updatedAt,
    );
  }
}
