export type ShowcaseProductCategoryModel = {
  _id: string;
  id: string;
  name: string;
  description?: string;
  rootCategory?: Omit<ShowcaseProductCategoryModel, 'rootCategory'>;
  createdAt: Date;
  updatedAt?: Date;
};

export class ShowcaseProductModel {
  static COLLECTION_NAME = 'products' as const;

  _id!: string;
  id!: string;
  name!: string;
  description?: string;
  price!: number;
  quantity!: number;
  image?: string;
  category?: ShowcaseProductCategoryModel;
  createdAt!: Date;
  updatedAt!: Date;
}
