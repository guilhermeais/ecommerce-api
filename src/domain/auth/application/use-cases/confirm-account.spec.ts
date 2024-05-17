import {
  ConfirmAccountRequest,
  ConfirmAccountUseCase,
} from './confirm-account';
import { UserRepository } from '../gateways/repositories/user-repository';
import { ConfirmationTokensRepository } from '../gateways/repositories/confirmation-tokens-repository';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { InMemoryUserRepository } from '@/infra/database/in-memory/repositories/in-memory-user-repository';
import { InMemoryConfirmationTokensRepository } from '@/infra/database/in-memory/repositories/in-memory-confirmation-tokens.repository';
import { Logger } from '@/shared/logger';
import { faker } from '@faker-js/faker';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { makeConfirmationToken } from 'test/auth/enterprise/entities/make-confirmation-token';
import { ConfirmationTokenExpiredError } from './errors/confirmation-token-expired-error';
import { makeUser } from 'test/auth/enterprise/entities/make-user';
import { InvalidConfirmationTokenError } from './errors/invalid-confirmation-token-error';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

describe('ConfirmAccountUseCase', () => {
  let sut: ConfirmAccountUseCase;
  let logger: Logger;
  let userRepository: UserRepository;
  let confirmationTokensRepository: ConfirmationTokensRepository;

  beforeEach(() => {
    logger = makeFakeLogger();
    userRepository = new InMemoryUserRepository();
    confirmationTokensRepository = new InMemoryConfirmationTokensRepository();

    sut = new ConfirmAccountUseCase(
      logger,
      userRepository,
      confirmationTokensRepository,
    );
  });

  function makeRequest(
    overrides?: Partial<ConfirmAccountRequest>,
  ): ConfirmAccountRequest {
    return {
      confirmationId: faker.string.uuid(),
      userId: faker.string.uuid(),
      ...overrides,
    };
  }

  it('should user the confirmation token and confirm the user', async () => {
    const user = makeUser();
    await userRepository.save(user);

    const token = makeConfirmationToken({
      userId: user.id,
    });
    await confirmationTokensRepository.save(token);

    const request = makeRequest({
      confirmationId: token.id.toString(),
      userId: user.id.toString(),
    });

    await sut.execute(request);

    const updatedToken = await confirmationTokensRepository.findById(token.id);
    const updatedUser = await userRepository.findById(user.id);

    expect(updatedToken!.used).toBe(true);
    expect(updatedUser!.isConfirmed).toBe(true);
  });

  describe('Exceptions', () => {
    it('should throw EntityNotFoundError if token confirmation does not exists', async () => {
      const request = makeRequest();

      await expect(sut.execute(request)).rejects.toThrowError(
        new EntityNotFoundError('Token de confirmação', request.confirmationId),
      );
    });

    it('should throw ConfirmationTokenExpiredError if token is expired', async () => {
      const createdAt = new Date(2021, 1, 1, 0, 0, 0);
      const expiresIn = 1000;
      const now = new Date(2021, 1, 1, 0, 0, 1, 1);

      vi.useFakeTimers({
        now,
      });

      const user = makeUser();
      await userRepository.save(user);

      const expiredToken = makeConfirmationToken({
        expiresIn,
        createdAt,
        userId: user.id,
        email: user.email,
        userName: user.name,
      });
      await confirmationTokensRepository.save(expiredToken);

      const request = makeRequest({
        confirmationId: expiredToken.id.toString(),
        userId: expiredToken.userId.toString(),
      });

      await expect(sut.execute(request)).rejects.toThrowError(
        new ConfirmationTokenExpiredError(),
      );

      vi.useRealTimers();
    });

    it('should throw InvalidConfirmationTokenError if the confirmation token does not belongs to the user requesting the confirmation', async () => {
      const user = makeUser();
      await userRepository.save(user);

      const tokenOfOtherUser = makeConfirmationToken({
        userId: new UniqueEntityID(faker.string.uuid()),
      });
      await confirmationTokensRepository.save(tokenOfOtherUser);

      const request = makeRequest({
        confirmationId: tokenOfOtherUser.id.toString(),
        userId: user.id.toString(),
      });

      await expect(sut.execute(request)).rejects.toThrowError(
        new InvalidConfirmationTokenError(),
      );
    });

    it('should throw EntityNotFoundError the user on the confirmation token does not exists', async () => {
      const token = makeConfirmationToken();
      await confirmationTokensRepository.save(token);

      const request = makeRequest({
        confirmationId: token.id.toString(),
        userId: token.userId.toString(),
      });

      await expect(sut.execute(request)).rejects.toThrowError(
        new EntityNotFoundError('Usuário', token.userId.toString()),
      );
    });
  });
});
