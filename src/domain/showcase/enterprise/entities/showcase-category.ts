import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export type ShowcaseCategoryProps = {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
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

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
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
