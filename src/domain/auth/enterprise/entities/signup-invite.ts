import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { NotAllowedError } from '@/core/errors/commom/not-allowed-error';
import { Role } from './enums/role';
import { SignUpInviteStatus } from './enums/signup-invite-status';
import { User } from './user';
import { Email } from './value-objects/email';

export type SignUpInviteProps = {
  guestEmail: Email;
  guestName: string;
  sentBy: User;
  expiresIn?: number;
  createdAt?: Date;
  status?: SignUpInviteStatus;
};

export class SignUpInvite extends Entity<SignUpInviteProps> {
  static create(props: SignUpInviteProps): SignUpInvite {
    const { sentBy } = props;
    const isSentByMaster = [Role.MASTER].includes(sentBy?.role);

    if (!isSentByMaster) {
      throw new NotAllowedError(SignUpInvite.name);
    }

    props.status = props.status ?? SignUpInviteStatus.PENDING;
    props.createdAt = props.createdAt || new Date();

    return new SignUpInvite(props);
  }

  static restore(props: SignUpInviteProps, id: UniqueEntityID): SignUpInvite {
    return new SignUpInvite(props, id);
  }

  public isExpired(now = new Date()): boolean {
    if (!this.props.expiresIn) {
      return false;
    }

    if (!this.props.createdAt) {
      return true;
    }

    return (
      now > new Date(this.props.createdAt.getTime() + this.props.expiresIn)
    );
  }

  get guestEmail(): Email {
    return this.props.guestEmail;
  }

  get guestName(): string {
    return this.props.guestName;
  }

  get sentBy(): User {
    return this.props.sentBy;
  }
}
