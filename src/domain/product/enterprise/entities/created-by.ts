import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export type CreatedByProps = {
  id: UniqueEntityID;
  name: string;
  email: string;
};

export class CreatedBy extends Entity<CreatedByProps> {
  public static create(props: CreatedByProps) {
    return new CreatedBy(props);
  }

  public static restore(props: CreatedByProps, id: UniqueEntityID) {
    return new CreatedBy(props, id);
  }

  get name() {
    return this.props.name;
  }

  get email() {
    return this.props.email;
  }
}
