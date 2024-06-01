import { Events } from '@/core/types/events';
import { InMemoryUserRepository } from '@/infra/database/in-memory/repositories/in-memory-user-repository';
import { Logger } from '@/shared/logger';
import { faker } from '@faker-js/faker';
import { cpf } from 'cpf-cnpj-validator';
import { FakeEncrypter } from 'test/auth/application/gateways/cryptography/fake-encrypter';
import { FakeHasher } from 'test/auth/application/gateways/cryptography/fake-hasher';
import { makeUser } from 'test/auth/enterprise/entities/make-user';
import { FakeEventManager } from 'test/core/type/event/fake-event-manager';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { Role } from '../../enterprise/entities/enums/role';
import { Email } from '../../enterprise/entities/value-objects/email';
import { InvalidCPFError } from '../../enterprise/entities/value-objects/errors/invalid-cpf-error';
import { InvalidEmailFormatError } from '../../enterprise/entities/value-objects/errors/invalid-email-format-error';
import { InvalidPasswordError } from '../../enterprise/entities/value-objects/errors/invalid-password-error';
import { ClientSignUpRequest, ClientSignUpUseCase } from './client-sign-up';
import { EmailAlreadyInUseError } from './errors/email-already-in-use-error';
import { MockProxy, mock } from 'vitest-mock-extended';
import { EnvService } from '@/infra/env/env.service';

describe('ClientSignUp usecase', () => {
  let userRepository: InMemoryUserRepository;
  let hasher: FakeHasher;
  let encrypter: FakeEncrypter;
  let eventManager: FakeEventManager;
  let logger: Logger;
  let sut: ClientSignUpUseCase;
  let envService: MockProxy<EnvService>;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    hasher = new FakeHasher();
    encrypter = new FakeEncrypter();
    eventManager = new FakeEventManager();
    logger = makeFakeLogger();
    envService = mock();

    sut = new ClientSignUpUseCase(
      userRepository,
      hasher,
      encrypter,
      eventManager,
      logger,
      envService,
    );
  });

  function makeClientSignUpRequest(
    modifications?: Partial<ClientSignUpRequest>,
  ): ClientSignUpRequest {
    return {
      email: faker.internet.email(),
      password: 'Aa34567#',
      name: faker.person.fullName(),
      cpf: cpf.generate(),
      phone: faker.phone.number(),
      address: {
        cep: faker.location.zipCode(),
        address: faker.location.street(),
        number: faker.location.zipCode(),
        state: faker.location.state(),
        city: faker.location.city(),
      },
      ...modifications,
    };
  }

  describe('exceptions', () => {
    it('should throw InvalidEmailFormatError if email is invalid', async () => {
      const request = makeClientSignUpRequest({ email: 'invalid-email' });

      await expect(sut.execute(request)).rejects.toThrowError(
        new InvalidEmailFormatError('invalid-email'),
      );
    });

    it('should throw EmailAlreadyInUseError if the email is already in use', async () => {
      const emailInUseString = faker.internet.email();
      const emailInUse = Email.create(emailInUseString);
      await userRepository.save(makeUser({ email: emailInUse }));

      const request = makeClientSignUpRequest({ email: emailInUseString });

      await expect(sut.execute(request)).rejects.toThrowError(
        new EmailAlreadyInUseError(emailInUseString),
      );
    });

    it('should throw InvalidPasswordError if password is invalid', async () => {
      const request = makeClientSignUpRequest({ password: 'short' });

      await expect(sut.execute(request)).rejects.toThrowError(
        new InvalidPasswordError('short'),
      );
    });

    it('should throw InvalidCPFError if CPF is invalid', async () => {
      const request = makeClientSignUpRequest({ cpf: 'invalid-cpf' });

      await expect(sut.execute(request)).rejects.toThrowError(
        new InvalidCPFError('invalid-cpf'),
      );
    });
  });

  it('should save the user on the user repository', async () => {
    const request = makeClientSignUpRequest();

    await sut.execute(request);

    const user = await userRepository.findByEmail(Email.create(request.email));
    expect(user).toBeDefined();

    expect(user!.name).toBe(request.name);
    expect(user!.email.value).toBe(request.email);
    expect(user!.cpf.value).toBe(request.cpf);
    expect(user!.phone).toBe(request.phone);
    expect(user!.address?.toObject()).toEqual(request.address);
    expect(user!.role).toBe(Role.USER);

    expect(user!.password).not.toBe(request.password);
    expect(await hasher.compare(request.password, user!.password)).toBe(true);
  });

  it('should publish user.created event', async () => {
    const request = makeClientSignUpRequest();

    const resolveTestPromise = new Promise<void>((resolve) => {
      eventManager.subscribe(Events.USER_CREATED, (user) => {
        expect(user).toBeDefined();
        expect(user!.name).toBe(request.name);
        expect(user!.email.value).toBe(request.email);
        expect(user!.cpf.value).toBe(request.cpf);
        expect(user!.phone).toBe(request.phone);
        expect(user?.address?.toObject()).toEqual(request.address);
        expect(user!.role).toBe(Role.USER);
      });

      resolve();
    });

    sut.execute(request);

    await resolveTestPromise;
  });

  it('should return an auth token', async () => {
    const request = makeClientSignUpRequest();

    const response = await sut.execute(request);

    expect(response.authToken).toBeDefined();
  });
});
