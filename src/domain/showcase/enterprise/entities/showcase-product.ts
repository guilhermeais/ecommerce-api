import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export type ShowcaseProductCategory = {
  id: UniqueEntityID;
  name: string;
  description?: string;
  rootCategory?: ShowcaseProductSubCategory;
  createdAt: Date;
  updatedAt?: Date;
};

export type ShowcaseProductSubCategory = Omit<
  ShowcaseProductCategory,
  'rootCategory'
>;

export type ShowCaseProductProps = {
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: ShowcaseProductCategory;
};

export class ShowcaseProduct extends Entity<ShowCaseProductProps> {
  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get price(): number {
    return this.props.price;
  }

  get image(): string | undefined {
    return this.props.image;
  }

  get category() {
    return this.props.category;
  }

  static create(
    props: ShowCaseProductProps,
    id?: UniqueEntityID,
    createdAt?: Date,
    updatedAt?: Date,
  ): ShowcaseProduct {
    return new ShowcaseProduct({ ...props }, id, createdAt, updatedAt);
  }

  static restore(
    props: ShowCaseProductProps,
    id: UniqueEntityID,
    createdAt: Date,
    updatedAt?: Date,
  ): ShowcaseProduct {
    return new ShowcaseProduct({ ...props }, id, createdAt, updatedAt);
  }
}
