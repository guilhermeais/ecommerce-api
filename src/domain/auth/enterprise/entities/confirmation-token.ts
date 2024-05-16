import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Email } from './value-objects/email';

export type ConfirmationTokenProps = {
  expiresIn: number;
  userId: UniqueEntityID;
  email: Email;
  userName: string;
  used?: boolean;
  createdAt?: Date;
};

export class ConfirmationToken extends Entity<ConfirmationTokenProps> {
  private constructor(props: ConfirmationTokenProps) {
    super(props);
  }

  public static create(props: ConfirmationTokenProps): ConfirmationToken {
    props!.createdAt = props.createdAt || new Date();
    props.used = props.used ?? false;
    return new ConfirmationToken(props);
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

  get used(): boolean {
    return this.props.used!;
  }

  isExpired(now = new Date()): boolean {
    return now > new Date(this.createdAt.getTime() + this.expiresIn);
  }

  markAsUsed(): void {
    this.props.used = true;
  }
}
