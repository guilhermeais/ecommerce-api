import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export type ProductProps = {
  name: string;
  description?: string;
  price: number;
  isShown?: boolean;
  subCategoryId: UniqueEntityID;
  image?: string;
};

export class Product extends Entity<ProductProps> {
  public static create(props: ProductProps) {
    return new Product(props);
  }

  public static restore(props: ProductProps, id: UniqueEntityID) {
    return new Product(props, id);
  }

  get name() {
    return this.props.name;
  }

  get description() {
    return this.props.description;
  }

  get price() {
    return this.props.price;
  }

  get isShown() {
    return this.props.isShown;
  }

  get subCategoryId() {
    return this.props.subCategoryId;
  }

  get image() {
    return this.props.image;
  }
}
