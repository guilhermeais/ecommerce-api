import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export type AdministratorProps = {
  id: UniqueEntityID;
  name: string;
  email: string;
};

export class Administrator extends Entity<AdministratorProps> {
  public static create(props: AdministratorProps) {
    return new Administrator(props);
  }

  public static restore(props: AdministratorProps, id: UniqueEntityID) {
    return new Administrator(props, id);
  }

  get name() {
    return this.props.name;
  }

  get email() {
    return this.props.email;
  }
}
