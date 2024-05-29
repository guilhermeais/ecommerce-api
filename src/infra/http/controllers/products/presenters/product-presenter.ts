import { Product } from '@/domain/product/enterprise/entities/product';

export type ProductHTTPResponse = {
  id: string;
  name: string;
  description?: string;
  price: number;
  isShown: boolean;
  category?: {
    id: string;
    name: string;
    rootCategory?: {
      id: string;
      name: string;
    };
  };
  image?: string;
  createdBy?: {
    id: string;
    name: string;
  };
  updatedBy?: {
    id: string;
    name: string;
  };
};

export class ProductPresenter {
  static toHTTP(product: Product): ProductHTTPResponse {
    return {
      description: product.description,
      id: product.id.toString(),
      image: product.image,
      isShown: product.isShown,
      name: product.name,
      price: product.price,
      category: product.subCategory && {
        id: product.subCategory.id.toString(),
        name: product.subCategory.name,
        rootCategory: product.subCategory.rootCategory && {
          id: product.subCategory.rootCategory.id.toString(),
          name: product.subCategory.rootCategory.name,
        },
      },
      createdBy: {
        id: product.createdBy.id.toString(),
        name: product.createdBy.name,
      },
      updatedBy: product.updatedBy && {
        id: product.updatedBy.id.toString(),
        name: product.updatedBy.name,
      },
    };
  }
}
