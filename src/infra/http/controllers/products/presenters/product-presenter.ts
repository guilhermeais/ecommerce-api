import { Product } from '@/domain/product/enterprise/entities/product';
import { CategoryHTTPResponse, CategoryPresenter } from './category-presenter';

export type ProductHTTPResponse = {
  id: string;
  name: string;
  description?: string;
  price: number;
  isShown: boolean;
  category?: CategoryHTTPResponse;
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
      category: product.subCategory?.id
        ? CategoryPresenter.toHTTP(product.subCategory)
        : undefined,
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
