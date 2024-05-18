import { UseCase } from '@/core/types/use-case';
import { SignUpInvitesRepository } from '../gateways/repositories/sign-up-invites.repository';
import { User } from '../../enterprise/entities/user';
import { SignUpInvite } from '../../enterprise/entities/signup-invite';
import { EventManager, Events } from '@/core/types/events';
import { Email } from '../../enterprise/entities/value-objects/email';
import { Injectable } from '@nestjs/common';

export type CreateSignUpInviteRequest = {
  email: string;
  name: string;
  sentBy: User;
};

export type CreateSignUpInviteResponse = {
  signUpInviteId: string;
};

@Injectable()
export class CreateSignUpInviteUseCase
  implements UseCase<CreateSignUpInviteRequest, CreateSignUpInviteResponse>
{
  constructor(
    private readonly signUpInvitesRepository: SignUpInvitesRepository,
    private readonly eventsManager: EventManager,
  ) {}

  async execute(
    request: CreateSignUpInviteRequest,
  ): Promise<CreateSignUpInviteResponse> {
    const { name, sentBy } = request;

    const email = Email.create(request.email);

    const signUpInvite = SignUpInvite.create({
      guestEmail: email,
      guestName: name,
      sentBy,
    });

    await this.signUpInvitesRepository.save(signUpInvite);

    await this.eventsManager.publish(
      Events.SIGN_UP_INVITE_CREATED,
      signUpInvite,
    );

    return {
      signUpInviteId: signUpInvite.id.toString(),
    };
  }
}
