export class MongoDbShowcaseCategoryModel {
  static COLLECTION_NAME = 'categories' as const;

  _id!: string;
  id!: string;
  name!: string;
  description?: string;
  rootCategory?: Omit<
    MongoDbShowcaseCategoryModel,
    'rootCategory' | 'childrenCategories'
  >;
  childrenCategories?: Omit<
    MongoDbShowcaseCategoryModel,
    'rootCategory' | 'childrenCategories'
  >[];
  createdAt!: Date;
  updatedAt!: Date;
}
