import { UserRepository } from '@/domain/auth/application/gateways/repositories/user-repository';
import { DefaultExceptionFilter } from '@/infra/http/filters/default-exception-filter.filter';

import { EventManager, Events } from '@/core/types/events';
import { ConfirmationTokensRepository } from '@/domain/auth/application/gateways/repositories/confirmation-tokens-repository';
import { ConfirmationToken } from '@/domain/auth/enterprise/entities/confirmation-token';
import { DatabaseModule } from '@/infra/database/database.module';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { makeSignUpBody } from 'test/infra/http/controllers/auth/sign-up-body.mock';
import { makeTestingApp } from 'test/make-testing-app';

describe('Signup and account confirmation E2E flow', () => {
  let app: INestApplication;
  let userRepository: UserRepository;
  let confirmationTokensRepository: ConfirmationTokensRepository;
  let eventManager: EventManager;

  beforeAll(async () => {
    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalFilters(new DefaultExceptionFilter());

    userRepository = moduleRef.get(UserRepository);
    confirmationTokensRepository = moduleRef.get(ConfirmationTokensRepository);
    eventManager = moduleRef.get(EventManager);

    await app.init();
  });

  beforeEach(async () => {
    await userRepository.clear();
    await confirmationTokensRepository.clear();
  });

  it('should create and confirm an account', async () => {
    const body = makeSignUpBody();

    const confirmationTokenCreated = new Promise<ConfirmationToken>(
      (resolve) => {
        eventManager.subscribe(Events.CONFIRMATION_TOKEN_CREATED, resolve);
      },
    );

    const response = await request(app.getHttpServer())
      .post('/sign-up')
      .send(body);

    expect(response.status).toBe(201);
    expect(response.body.authToken).toEqual(expect.any(String));

    const { authToken } = response.body;

    const confirmationToken = await confirmationTokenCreated;

    const user = await userRepository.findById(confirmationToken.userId);
    expect(user!.isConfirmed).toBe(false);

    const confirmTokenResponse = await request(app.getHttpServer())
      .post(`/sign-up/${confirmationToken.id.toString()}/confirm`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(confirmTokenResponse.status).toBe(201);

    const updatedUser = await userRepository.findById(confirmationToken.userId);

    expect(updatedUser!.isConfirmed).toBe(true);
  });
});
