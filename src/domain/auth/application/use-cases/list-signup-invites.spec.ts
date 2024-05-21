import { Logger } from '@/shared/logger';
import { SignUpInvitesRepository } from '../gateways/repositories/sign-up-invites.repository';
import {
  ListSignUpInvitesRequest,
  ListSignUpInvitesUseCase,
} from './list-signup-invites';
import { InMemorySignUpInvitesRepository } from '@/infra/database/in-memory/repositories/in-memory-sign-up-tokens.repository';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { makeSignUpInvite } from 'test/auth/enterprise/entities/make-sign-up-invite';

export function makeListSignUpInvitesRequest(
  overrides?: Partial<ListSignUpInvitesRequest>,
): ListSignUpInvitesRequest {
  return {
    page: 1,
    limit: 10,
    ...overrides,
  };
}

describe('ListSignUpInvites usecase', () => {
  let sut: ListSignUpInvitesUseCase;
  let signupInvitesRepository: SignUpInvitesRepository;
  let logger: Logger;

  beforeEach(() => {
    signupInvitesRepository = new InMemorySignUpInvitesRepository();
    logger = makeFakeLogger();

    sut = new ListSignUpInvitesUseCase(signupInvitesRepository, logger);
  });

  it('should list all signup invites', async () => {
    await Promise.all(
      Array.from(
        { length: 10 },
        async () => await signupInvitesRepository.save(makeSignUpInvite()),
      ),
    );

    const request = makeListSignUpInvitesRequest({
      limit: 5,
    });

    const response = await sut.execute(request);

    expect(response.items.length).toBe(5);
    expect(response.total).toBe(10);

    const nextPage = await sut.execute({
      ...request,
      page: 2,
    });

    expect(nextPage.items.length).toBe(5);
    expect(nextPage.total).toBe(10);
  });
});
