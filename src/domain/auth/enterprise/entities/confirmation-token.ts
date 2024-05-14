import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Email } from './value-objects/email';

export type ConfirmationTokenProps = {
  token: string;
  expiresIn: number;
  userId: UniqueEntityID;
  email: Email;
  userName: string;
  createdAt?: Date;
};

export class ConfirmationToken extends Entity<ConfirmationTokenProps> {
  private constructor(props: ConfirmationTokenProps) {
    super(props);
  }

  public static create(props: ConfirmationTokenProps): ConfirmationToken {
    props!.createdAt = props.createdAt || new Date();
    return new ConfirmationToken(props);
  }

  get token(): string {
    return this.props.token;
  }

  get expiresIn(): number {
    return this.props.expiresIn;
  }

  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get email(): Email {
    return this.props.email;
  }

  get userName(): string {
    return this.props.userName;
  }

  get createdAt(): Date {
    return this.props!.createdAt!;
  }

  isExpired(now = new Date()): boolean {
    return now > new Date(this.createdAt.getTime() + this.expiresIn);
  }
}
