import { SignUpInviteStatus } from '@/domain/auth/enterprise/entities/enums/signup-invite-status';
import { SignUpInvite } from '@/domain/auth/enterprise/entities/signup-invite';
import { UserHTTPResponse, UserPresenter } from './user-presenter';

export type SignUpInviteHTTPResponse = {
  id: string;
  guestEmail: string;
  guestName: string;
  createdAt: string;
  expiresIn?: number;
  status: SignUpInviteStatus;
  isExpired: boolean;
  sentBy: UserHTTPResponse;
};

export class SignUpInvitePresenter {
  static toHTTP(signUpInvite: SignUpInvite): SignUpInviteHTTPResponse {
    return {
      id: signUpInvite.id.toString(),
      guestEmail: signUpInvite.guestEmail.value,
      guestName: signUpInvite.guestName,
      isExpired: signUpInvite.isExpired(),
      status: signUpInvite.status,
      createdAt: signUpInvite.createdAt.toISOString(),
      expiresIn: signUpInvite.expiresIn,
      sentBy: UserPresenter.toHTTP(signUpInvite.sentBy),
    };
  }
}
