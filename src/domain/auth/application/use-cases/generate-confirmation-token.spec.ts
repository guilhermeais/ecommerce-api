import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { InMemoryConfirmationTokensRepository } from '@/infra/database/in-memory/repositories/in-memory-confirmation-tokens.repository';
import { InMemoryUserRepository } from '@/infra/database/in-memory/repositories/in-memory-user-repository';
import { EnvService } from '@/infra/env/env.service';
import { Logger } from '@/shared/logger';
import { faker } from '@faker-js/faker';
import { makeUser } from 'test/auth/enterprise/entities/make-user';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { MockProxy, mock } from 'vitest-mock-extended';
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
  let envService: MockProxy<EnvService>;

  const CONFIRMATION_TOKEN_EXPIRES_IN = 1000 * 60 * 60 * 24;

  beforeAll(() => {
    vi.useFakeTimers();
  });

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    confirmationsTokenRepository = new InMemoryConfirmationTokensRepository();
    logger = makeFakeLogger();
    envService = mock();

    envService.get.mockReturnValue(CONFIRMATION_TOKEN_EXPIRES_IN);

    sut = new GenerateConfirmationTokenUseCase(
      userRepository,
      logger,
      confirmationsTokenRepository,
      envService,
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
    expect(confirmationToken.email.toString()).toBe(
      existingUser.email.toString(),
    );
    expect(confirmationToken.userName.toString()).toBe(
      existingUser.name.toString(),
    );
    expect(confirmationToken.userId.toString()).toBe(
      existingUser.id.toString(),
    );
    expect(confirmationToken.used).toBe(false);
    expect(confirmationToken.expiresIn).toBeDefined();
    expect(confirmationToken.expiresIn).toBe(CONFIRMATION_TOKEN_EXPIRES_IN);

    expect(
      await confirmationsTokenRepository.findById(confirmationToken.id),
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
