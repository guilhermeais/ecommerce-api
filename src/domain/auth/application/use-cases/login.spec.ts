import { InMemoryUserRepository } from '@/infra/database/in-memory/repositories/in-memory-user-repository';
import { Logger } from '@/shared/logger';
import { faker } from '@faker-js/faker';
import { FakeEncrypter } from 'test/auth/application/gateways/cryptography/fake-encrypter';
import { FakeHasher } from 'test/auth/application/gateways/cryptography/fake-hasher';
import { makeUser } from 'test/auth/enterprise/entities/make-user';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { Encrypter } from '../gateways/cryptography/encrypter';
import { Hasher } from '../gateways/cryptography/hasher';
import { UsersRepository } from '../gateways/repositories/user-repository';
import { InvalidLoginRequestError } from './errors/invalid-login-request-error';
import { LoginRequest, LoginUseCase } from './login';
import { MockProxy, mock } from 'vitest-mock-extended';
import { EnvService } from '@/infra/env/env.service';

describe('Login use case', () => {
  let sut: LoginUseCase;
  let userRepository: UsersRepository;
  let hasher: Hasher;
  let encrypter: Encrypter;
  let logger: Logger;
  let envService: MockProxy<EnvService>;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    hasher = new FakeHasher();
    encrypter = new FakeEncrypter();
    logger = makeFakeLogger();
    envService = mock();

    sut = new LoginUseCase(
      userRepository,
      hasher,
      encrypter,
      logger,
      envService,
    );
  });

  function makeLoginUseCaseRequest(
    modifications?: Partial<LoginRequest>,
  ): LoginRequest {
    return {
      email: faker.internet.email(),
      password: faker.internet.password(),
      ...modifications,
    };
  }

  it('should throw InvalidLoginRequestError if user with provided email is not found', async () => {
    const request = makeLoginUseCaseRequest();

    await expect(sut.execute(request)).rejects.toThrowError(
      new InvalidLoginRequestError(),
    );
  });

  it('should throw InvalidLoginRequestError if password is invalid', async () => {
    const user = makeUser();
    await userRepository.save(user);

    const request = makeLoginUseCaseRequest({
      email: user.email.value,
      password: faker.internet.password(),
    });

    await expect(sut.execute(request)).rejects.toThrowError(
      new InvalidLoginRequestError(),
    );
  });

  it('should return the auth token and the user', async () => {
    const plainPass = faker.internet.password();
    const hashedPassword = await hasher.hash(plainPass);
    const user = makeUser({
      password: hashedPassword,
    });
    await userRepository.save(user);

    const request = makeLoginUseCaseRequest({
      email: user.email.value,
      password: plainPass,
    });

    const response = await sut.execute(request);

    expect(response.user).toEqual(user);
    expect(response.authToken).toBeTypeOf('string');
  });
});
