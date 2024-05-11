import { Entity } from '@/core/entities/entity';

export type ConfirmationTokenProps = {
  token: string;
  expiresIn: number;
  userId: string;
  createdAt?: Date;
};

export class ConfirmationToken extends Entity<ConfirmationTokenProps> {
  private constructor(props: ConfirmationTokenProps) {
    super(props);
  }

  public static create(props: ConfirmationTokenProps): ConfirmationToken {
    props.createdAt = props.createdAt || new Date();
    return new ConfirmationToken(props);
  }

  get token(): string {
    return this.props.token;
  }

  get expiresIn(): number {
    return this.props.expiresIn;
  }

  get userId(): string {
    return this.props.userId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isExpired(now = new Date()): boolean {
    return now > new Date(this.createdAt.getTime() + this.expiresIn);
  }
}
