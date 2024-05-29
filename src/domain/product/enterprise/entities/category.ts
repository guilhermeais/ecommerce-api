import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export type CategoryProps = {
  name: string;
  description?: string;
  rootCategory?: Category;
};

export class Category extends Entity<CategoryProps> {
  public static create(props: CategoryProps) {
    return new Category(props);
  }

  public static restore(props: CategoryProps, id: UniqueEntityID) {
    return new Category(props, id);
  }

  get name() {
    return this.props.name;
  }

  get description() {
    return this.props.description;
  }

  get rootCategory() {
    return this.props.rootCategory;
  }
}
