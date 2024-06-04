import { ShowcaseProduct } from '@/domain/showcase/enterprise/entities/showcase-product';

export type ShowcaseProductHTTPResponse = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: {
    id: string;
    name: string;
    description?: string;
    rootCategory?: {
      id: string;
      name: string;
      description?: string;
    };
  };
  image?: string;
};

export class ShowcaseProductPresenter {
  static toHTTP(product: ShowcaseProduct): ShowcaseProductHTTPResponse {
    return {
      id: product.id.toString(),
      name: product.name,
      price: product.price,
      category: product?.category && {
        id: product.category.id.toString(),
        name: product.category.name,
        description: product.category.description,
        rootCategory: product.category.rootCategory && {
          id: product.category.rootCategory.id.toString(),
          description: product.category.rootCategory.description,
          name: product.category.rootCategory.name,
        },
      },
    };
  }
}
