import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { InMemoryConfirmationTokensRepository } from '@/infra/database/in-memory/repositories/in-memory-confirmation-tokens.repository';
import { InMemoryUserRepository } from '@/infra/database/in-memory/repositories/in-memory-user-repository';
import { Logger } from '@/shared/logger';
import { faker } from '@faker-js/faker';
import { FakeEncrypter } from 'test/auth/application/gateways/cryptography/fake-encrypter';
import { makeUser } from 'test/auth/enterprise/entities/make-user';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { Encrypter } from '../gateways/cryptography/encrypter';
import { ConfirmationTokensRepository } from '../gateways/repositories/confirmation-tokens-repository';
import { UserRepository } from '../gateways/repositories/user-repository';
import {
  GenerateConfirmationTokenRequest,
  GenerateConfirmationTokenUseCase,
} from './generate-confirmation-token';

describe('GenerateConfirmationTokenUseCase', () => {
  let sut: GenerateConfirmationTokenUseCase;
  let userRepository: UserRepository;
  let confirmationsTokenRepository: ConfirmationTokensRepository;
  let logger: Logger;
  let encrypter: Encrypter;

  beforeAll(() => {
    vi.useFakeTimers();
  });

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    confirmationsTokenRepository = new InMemoryConfirmationTokensRepository();
    logger = makeFakeLogger();
    encrypter = new FakeEncrypter();

    sut = new GenerateConfirmationTokenUseCase(
      userRepository,
      logger,
      encrypter,
      confirmationsTokenRepository,
    );
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  function makeRequest(
    modifications?: Partial<GenerateConfirmationTokenRequest>,
  ): GenerateConfirmationTokenRequest {
    return {
      userId: faker.string.uuid(),
      ...modifications,
    };
  }

  it('should throw EntityNotFoundError if user does not exists', async () => {
    const request = makeRequest();

    await expect(sut.execute(request)).rejects.toThrowError(
      new EntityNotFoundError('Usuário', request.userId),
    );
  });

  it('should generate a confirmation token to the user', async () => {
    const existingUserId = new UniqueEntityID();
    const request = makeRequest({
      userId: existingUserId.toString(),
    });

    const existingUser = makeUser({ id: existingUserId });
    await userRepository.save(existingUser);

    const confirmationToken = await sut.execute(request);

    expect(confirmationToken.id.toString()).toBeTypeOf('string');
    expect(confirmationToken.token).toBeDefined();
    expect(confirmationToken.expiresIn).toBeDefined();
    expect(confirmationToken.expiresIn).toBe(1000 * 60 * 60 * 24);

    const decodedToken = await encrypter.decode(confirmationToken.token);

    expect(decodedToken.userId).toBe(existingUserId.toString());
    expect(decodedToken.email).toBe(existingUser.email.value);
    expect(decodedToken.createdAt).toBe(new Date().toISOString());

    expect(
      await confirmationsTokenRepository.findByToken(confirmationToken.token),
    ).toBeDefined();
  });

  it('should generate a confirmation token with different expiration', async () => {
    const existingUserId = new UniqueEntityID();
    const request = makeRequest({
      userId: existingUserId.toString(),
      expiresIn: 1000 * 60 * 60 * 24 * 2,
    });

    const existingUser = makeUser({ id: existingUserId });
    await userRepository.save(existingUser);

    const response = await sut.execute(request);

    expect(response.expiresIn).toBe(1000 * 60 * 60 * 24 * 2);
  });
});
