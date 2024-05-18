import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { NotAllowedError } from '@/core/errors/commom/not-allowed-error';
import { SignUpInviteExpiredError } from '../../application/use-cases/errors/signup-invite-expired-error';
import { Role } from './enums/role';
import { SignUpInviteStatus } from './enums/signup-invite-status';
import { User, UserProps } from './user';
import { Email } from './value-objects/email';

export type SignUpInviteProps = {
  id?: UniqueEntityID;
  guestEmail: Email;
  guestName: string;
  sentBy: User;
  expiresIn?: number;
  createdAt?: Date;
  status: SignUpInviteStatus;
};

export type CreateSignUpInviteData = Omit<SignUpInviteProps, 'status'>;

export type FinishUserSignUpData = Omit<
  UserProps,
  'signUpInviteId' | 'role' | 'isConfirmed' | 'name' | 'email'
> & {
  name?: string;
};

export class SignUpInvite extends Entity<SignUpInviteProps> {
  static create(props: CreateSignUpInviteData): SignUpInvite {
    const { sentBy } = props;
    const isSentByMaster = [Role.MASTER].includes(sentBy?.role);

    if (!isSentByMaster) {
      throw new NotAllowedError(SignUpInvite.name);
    }

    props.createdAt = props.createdAt || new Date();

    return new SignUpInvite(
      {
        ...props,
        status: SignUpInviteStatus.PENDING,
      },
      props.id,
    );
  }

  static restore(props: SignUpInviteProps, id: UniqueEntityID): SignUpInvite {
    return new SignUpInvite(props, id);
  }

  public finishSignUp(userData: FinishUserSignUpData): User {
    if (this.isExpired() || this.isFinished()) {
      throw new SignUpInviteExpiredError(this);
    }

    const user = User.create({
      name: this.guestName,
      ...userData,
      email: this.guestEmail,
      signUpInviteId: this.id,
      role: Role.ADMIN,
      isConfirmed: true,
    });

    this.props.status = SignUpInviteStatus.FINISHED;

    return user;
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

  public isFinished(): boolean {
    return this.props.status === SignUpInviteStatus.FINISHED;
  }

  get status(): SignUpInviteStatus {
    return this.props.status;
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
