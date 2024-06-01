import { EventManager } from '@/core/types/events';
import { Encrypter } from '../gateways/cryptography/encrypter';
import { Hasher } from '../gateways/cryptography/hasher';
import { SignUpInvitesRepository } from '../gateways/repositories/sign-up-invites.repository';
import { UsersRepository } from '../gateways/repositories/user-repository';
import {
  FinishSigUpInviteRequest,
  FinishSignUpInviteUseCase,
} from './finish-sign-up-invite';
import { Logger } from '@/shared/logger';
import { InMemoryUserRepository } from '@/infra/database/in-memory/repositories/in-memory-user-repository';
import { FakeHasher } from 'test/auth/application/gateways/cryptography/fake-hasher';
import { FakeEncrypter } from 'test/auth/application/gateways/cryptography/fake-encrypter';
import { FakeEventManager } from 'test/core/type/event/fake-event-manager';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { InMemorySignUpInvitesRepository } from '@/infra/database/in-memory/repositories/in-memory-sign-up-tokens.repository';
import { faker } from '@faker-js/faker';
import { cpf } from 'cpf-cnpj-validator';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { InvalidPasswordError } from '../../enterprise/entities/value-objects/errors/invalid-password-error';
import { makeSignUpInvite } from 'test/auth/enterprise/entities/make-sign-up-invite';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { InvalidCPFError } from '../../enterprise/entities/value-objects/errors/invalid-cpf-error';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { Role } from '../../enterprise/entities/enums/role';
import { SignUpInviteExpiredError } from './errors/signup-invite-expired-error';
import { CPF } from '../../enterprise/entities/value-objects/cpf';
import { EnvService } from '@/infra/env/env.service';
import { MockProxy, mock } from 'vitest-mock-extended';

describe('FinishSignUpInvite use case', () => {
  let sut: FinishSignUpInviteUseCase;
  let signUpInvitesRepository: SignUpInvitesRepository;
  let userRepository: UsersRepository;
  let hasher: Hasher;
  let encrypter: Encrypter;
  let eventManager: EventManager;
  let logger: Logger;
  let envService: MockProxy<EnvService>;

  beforeEach(() => {
    signUpInvitesRepository = new InMemorySignUpInvitesRepository();
    userRepository = new InMemoryUserRepository();
    hasher = new FakeHasher();
    encrypter = new FakeEncrypter();
    eventManager = new FakeEventManager();
    logger = makeFakeLogger();
    envService = mock();

    sut = new FinishSignUpInviteUseCase(
      signUpInvitesRepository,
      userRepository,
      hasher,
      encrypter,
      eventManager,
      logger,
      envService,
    );
  });

  function makeFinishSignUpInviteRequest(
    modifications?: Partial<FinishSigUpInviteRequest>,
  ): FinishSigUpInviteRequest {
    return {
      inviteId: faker.string.uuid(),
      userData: {
        cpf: cpf.generate(),
        name: faker.person.fullName(),
        password: 'Aa34567#',
        phone: faker.phone.number(),
      },
      ...modifications,
    };
  }

  it('should finish a signup invite', async () => {
    const invite = makeSignUpInvite();
    await signUpInvitesRepository.save(invite);

    const request = makeFinishSignUpInviteRequest({
      inviteId: invite.id.toString(),
    });

    const { authToken, user } = await sut.execute(request);

    expect(authToken).toBeDefined();
    expect(await encrypter.decode<UserPayload>(authToken)).toEqual({
      sub: user.id.toString(),
    });

    expect(user).toBeDefined();
    expect(user.email.value).toBe(invite.guestEmail.value);
    expect(user.name).toBe(request.userData.name);
    expect(user.cpf.value).toBe(request.userData.cpf);
    expect(user.phone).toBe(request.userData.phone);
    expect(user.role).toBe(Role.ADMIN);
    expect(user.isConfirmed).toBe(true);
    expect(user.signUpInviteId?.equals(invite.id)).toBe(true);
    expect(await hasher.compare(request.userData.password, user.password)).toBe(
      true,
    );

    const updatedInvite = await signUpInvitesRepository.findById(invite.id);

    expect(updatedInvite!.isFinished()).toBe(true);

    const savedUser = await userRepository.findById(user.id);

    expect(savedUser).toBeDefined();
    expect(savedUser!.equals(user)).toBe(true);
  });

  describe('Exceptions', () => {
    it('should throw EntityNotFoundError if the invite does not exists', async () => {
      const request = makeFinishSignUpInviteRequest();

      await expect(sut.execute(request)).rejects.toThrowError(
        new EntityNotFoundError('Convite de Cadastro', request.inviteId),
      );
    });

    it('should throw SignUpInviteExpiredError if the invite is expired', async () => {
      const invite = makeSignUpInvite({
        expiresIn: -1,
      });
      await signUpInvitesRepository.save(invite);

      const request = makeFinishSignUpInviteRequest({
        inviteId: invite.id.toString(),
      });

      await expect(sut.execute(request)).rejects.toThrowError(
        new SignUpInviteExpiredError(invite),
      );
    });

    it('should throw SignUpInviteExpiredError if the invite is finished', async () => {
      const invite = makeSignUpInvite();
      invite.finishSignUp({
        cpf: CPF.create(cpf.generate()),
        name: faker.person.fullName(),
        password: 'Aa34567#',
        phone: faker.phone.number(),
      });
      await signUpInvitesRepository.save(invite);

      const request = makeFinishSignUpInviteRequest({
        inviteId: invite.id.toString(),
      });

      await expect(sut.execute(request)).rejects.toThrowError(
        new SignUpInviteExpiredError(invite),
      );
    });

    it.each([
      {
        when: 'the password is invalid',
        request: makeFinishSignUpInviteRequest({
          userData: {
            cpf: cpf.generate(),
            name: faker.person.fullName(),
            password: 'invalid-password',
            phone: faker.phone.number(),
          },
        }),
        expectedError: new InvalidPasswordError('invalid-password'),
      },
      {
        when: 'the cpf is invalid',
        request: makeFinishSignUpInviteRequest({
          userData: {
            cpf: '123',
            name: faker.person.fullName(),
            password: 'Aa34567#',
            phone: faker.phone.number(),
          },
        }),
        expectedError: new InvalidCPFError('123'),
      },
    ] as {
      request: FinishSigUpInviteRequest;
      expectedError: Error;
      when: string;
    }[])(
      'should throw $expectedError.name when $when',
      async ({ request, expectedError }) => {
        await signUpInvitesRepository.save(
          makeSignUpInvite({
            id: new UniqueEntityID(request.inviteId),
          }),
        );

        await expect(sut.execute(request)).rejects.toThrowError(expectedError);
      },
    );
  });
});
