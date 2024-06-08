import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export type ShowcaseCategoryProps = {
  name: string;
  description?: string;
  rootCategory?: ShowcaseCategory;
  childrenCategories?: ShowcaseCategory[];
};

export class ShowcaseCategory extends Entity<ShowcaseCategoryProps> {
  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get rootCategory() {
    return this.props.rootCategory;
  }

  get childrenCategories() {
    return this.props.childrenCategories;
  }

  static create(
    props: ShowcaseCategoryProps,
    id?: UniqueEntityID,
    createdAt?: Date,
    updatedAt?: Date,
  ): ShowcaseCategory {
    return new ShowcaseCategory({ ...props }, id, createdAt, updatedAt);
  }

  static restore(
    props: ShowcaseCategoryProps,
    id: UniqueEntityID,
    createdAt: Date,
    updatedAt?: Date,
  ): ShowcaseCategory {
    return new ShowcaseCategory({ ...props }, id, createdAt, updatedAt);
  }
}
