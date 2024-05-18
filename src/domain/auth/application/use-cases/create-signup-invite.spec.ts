import { EventManager, Events } from '@/core/types/events';
import { SignUpInvitesRepository } from '../gateways/repositories/sign-up-invites.repository';
import {
  CreateSignUpInviteRequest,
  CreateSignUpInviteUseCase,
} from './create-signup-invite';
import { InMemorySignUpInvitesRepository } from '@/infra/database/in-memory/repositories/in-memory-sign-up-tokens.repository';
import { FakeEventManager } from 'test/core/type/event/fake-event-manager';
import { makeUser } from 'test/auth/enterprise/entities/make-user';
import { Role } from '../../enterprise/entities/enums/role';
import { faker } from '@faker-js/faker';
import { NotAllowedError } from '@/core/errors/commom/not-allowed-error';
import { SignUpInvite } from '../../enterprise/entities/signup-invite';
import { InvalidEmailFormatError } from '../../enterprise/entities/value-objects/errors/invalid-email-format-error';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

describe('CreateSignupInvite usecase', () => {
  let sut: CreateSignUpInviteUseCase;
  let signUpInvitesRepository: SignUpInvitesRepository;
  let eventsManager: EventManager;

  beforeEach(() => {
    signUpInvitesRepository = new InMemorySignUpInvitesRepository();
    eventsManager = new FakeEventManager();
    sut = new CreateSignUpInviteUseCase(signUpInvitesRepository, eventsManager);
  });

  function makeCreateSignUpInviteRequest(
    modifications?: Partial<CreateSignUpInviteRequest>,
  ): CreateSignUpInviteRequest {
    return {
      email: faker.internet.email(),
      name: faker.person.fullName(),
      sentBy: makeUser({
        role: Role.MASTER,
      }),
      ...modifications,
    };
  }

  it('should create the signup invite', async () => {
    const request = makeCreateSignUpInviteRequest();

    const singUpInviteCreatedPromise = new Promise<SignUpInvite>((resolve) => {
      eventsManager.subscribe(Events.SIGN_UP_INVITE_CREATED, resolve);
    });

    const response = await sut.execute(request);

    const signUpInvite = await signUpInvitesRepository.findById(
      new UniqueEntityID(response.signUpInviteId),
    );

    expect(signUpInvite).toBeDefined();
    expect(signUpInvite!.guestEmail.value).toBe(request.email);
    expect(signUpInvite!.guestName).toBe(request.name);
    expect(signUpInvite!.sentBy).toBe(request.sentBy);

    const eventSignUpInvite = await singUpInviteCreatedPromise;

    expect(eventSignUpInvite).toEqual(signUpInvite);
  });

  it('should throw InvalidEmailFormatError if the email is invalid', async () => {
    const request = makeCreateSignUpInviteRequest({
      email: 'invalid-email',
    });

    await expect(sut.execute(request)).rejects.toThrowError(
      new InvalidEmailFormatError(request.email),
    );
  });

  it('should throw NotAllowed if the user is not a master', async () => {
    const sentBy = makeUser({
      role: Role.USER,
    });

    const request = makeCreateSignUpInviteRequest({
      sentBy,
    });

    await expect(sut.execute(request)).rejects.toThrowError(
      new NotAllowedError(SignUpInvite.name),
    );
  });
});
