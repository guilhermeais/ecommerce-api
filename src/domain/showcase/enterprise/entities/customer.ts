import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export type CustomerProps = {
  name: string;
  email: string;
};

export class Customer extends Entity<CustomerProps> {
  static restore(
    props: CustomerProps,
    id: UniqueEntityID,
    createdAt: Date,
    updatedAt: Date,
  ) {
    return new Customer(props, id, createdAt, updatedAt);
  }

  get name() {
    return this.props.name;
  }

  get email() {
    return this.props.email;
  }
}
