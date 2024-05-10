import { InMemoryUserRepository } from '@/infra/database/in-memory/repositories/in-memory-user-repository';
import { Logger } from '@/shared/logger';
import { faker } from '@faker-js/faker';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { GetUserUseCase, GetUserRequest } from './get-user';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { makeUser } from 'test/auth/enterprise/entities/make-user';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

describe('GetUser usecase', () => {
  let userRepository: InMemoryUserRepository;

  let logger: Logger;
  let sut: GetUserUseCase;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();

    logger = makeFakeLogger();

    sut = new GetUserUseCase(userRepository, logger);
  });

  function makeGetUserRequest(
    modifications?: Partial<GetUserRequest>,
  ): GetUserRequest {
    return {
      userId: faker.string.uuid(),
      ...modifications,
    };
  }

  describe('exceptions', () => {
    it('should throw EntityNotFoundError if user is not found', async () => {
      const request = makeGetUserRequest();

      await expect(sut.execute(request)).rejects.toThrowError(
        new EntityNotFoundError('Usuário', request.userId),
      );
    });
  });

  it('should return the user', async () => {
    const id = new UniqueEntityID();
    const user = makeUser({
      id,
    });

    await userRepository.save(user);

    const request = makeGetUserRequest({ userId: user.id.toString() });

    const response = await sut.execute(request);

    expect(response).toEqual(user);
  });
});
