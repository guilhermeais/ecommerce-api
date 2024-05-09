import { Entity } from '@/core/entities/entity';
import { Role } from './enums/role';
import { Address } from './value-objects/address';
import { CPF } from './value-objects/cpf';
import { Email } from './value-objects/email';
import { Password } from './value-objects/password';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export type UserProps = {
  email: Email;
  password: Password;
  cpf: CPF;
  address: Address;
  name: string;
  phone: string;
  role: Role;
  isConfirmed: boolean;
};

export class User extends Entity<UserProps> {
  static create(props: UserProps) {
    return new User({
      ...props,
      isConfirmed: !!props.isConfirmed,
    });
  }

  static restore = (props: UserProps, id: UniqueEntityID) => {
    return new User(props, id);
  };

  get email() {
    return this.props.email;
  }

  get password() {
    return this.props.password;
  }

  get cpf() {
    return this.props.cpf;
  }

  get address() {
    return this.props.address;
  }

  get name() {
    return this.props.name;
  }

  get phone() {
    return this.props.phone;
  }

  get role() {
    return this.props.role;
  }

  get isConfirmed() {
    return this.props.isConfirmed;
  }

  public confirm() {
    this.props.isConfirmed = true;
  }
}
