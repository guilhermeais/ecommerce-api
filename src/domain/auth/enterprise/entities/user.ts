import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Role } from './enums/role';
import { Address } from './value-objects/address';
import { CPF } from './value-objects/cpf';
import { Email } from './value-objects/email';
import { ConfirmationToken } from './confirmation-token';

export type UserProps = {
  id?: UniqueEntityID;
  email: Email;
  password: string;
  cpf: CPF;
  address?: Address;
  name: string;
  phone?: string;
  role: Role;
  isConfirmed?: boolean;
  signUpInviteId?: UniqueEntityID;
  createdAt?: Date;
  updatedAt?: Date;
};

export class User extends Entity<UserProps> {
  static create(props: UserProps) {
    return new User(
      {
        ...props,
        isConfirmed: !!props.isConfirmed,
        createdAt: new Date(),
      },
      props.id,
    );
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

  get signUpInviteId() {
    return this.props.signUpInviteId;
  }

  get createdAt() {
    return this.props.createdAt!;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  public confirm(confirmationToken: ConfirmationToken) {
    confirmationToken.markAsUsed();
    this.props.isConfirmed = true;
  }

  setSignUpInviteId(signUpInviteId: UniqueEntityID) {
    this.props.signUpInviteId = signUpInviteId;
  }
}
