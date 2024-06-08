import { ShowcaseCategory } from '@/domain/showcase/enterprise/entities/showcase-category';

export type ShowcaseCategoryHTTPResponse = {
  id: string;
  name: string;
  description?: string;
  subCategories: ShowcaseSubCategoryHTTPResponse[];
};

type ShowcaseSubCategoryHTTPResponse = Omit<
  ShowcaseCategoryHTTPResponse,
  'subCategories'
>;

export class ShowcaseCategoryPresenter {
  static toHTTP(category: ShowcaseCategory): ShowcaseCategoryHTTPResponse {
    return {
      id: category.id.toString(),
      name: category.name,
      description: category.description,
      subCategories: category?.childrenCategories
        ? category.childrenCategories.map(
            ShowcaseCategoryPresenter.mapSubCategory,
          )
        : [],
    };
  }

  private static mapSubCategory(
    subCategory: ShowcaseCategory,
  ): ShowcaseSubCategoryHTTPResponse {
    return {
      id: subCategory.id.toString(),
      name: subCategory.name,
      description: subCategory.description,
    };
  }
}
