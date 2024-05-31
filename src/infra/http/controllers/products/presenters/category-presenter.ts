import { Category } from '@/domain/product/enterprise/entities/category';

export type CategoryHTTPResponse = {
  id: string;
  name: string;
  description?: string;
  rootCategory?: {
    id: string;
    name: string;
    description?: string;
  };
};

export class CategoryPresenter {
  static toHTTP(category: Category): CategoryHTTPResponse {
    return {
      description: category.description,
      id: category.id.toString(),
      name: category.name,
      rootCategory: category.rootCategory && {
        description: category.rootCategory.description,
        id: category.rootCategory.id.toString(),
        name: category.rootCategory.name,
      },
    };
  }
}
