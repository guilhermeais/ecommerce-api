import { UserRepository } from '@/domain/auth/application/gateways/repositories/user-repository';
import { DefaultExceptionFilter } from '@/infra/http/filters/default-exception-filter.filter';

import { EventManager, Events } from '@/core/types/events';
import { ConfirmationTokensRepository } from '@/domain/auth/application/gateways/repositories/confirmation-tokens-repository';
import { User } from '@/domain/auth/enterprise/entities/user';
import { DatabaseModule } from '@/infra/database/database.module';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { makeSignUpBody } from 'test/infra/http/controllers/auth/sign-up-body.mock';
import { makeTestingApp } from 'test/make-testing-app';

describe('Signup and login E2E flow', () => {
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
    eventManager.clearSubscriptions();
    await userRepository.clear();
    await confirmationTokensRepository.clear();
  });

  it('should create and login', async () => {
    const body = makeSignUpBody();

    const userCreatedPromise = new Promise<User>((resolve) => {
      eventManager.subscribe(Events.USER_CREATED, resolve);
    });

    const response = await request(app.getHttpServer())
      .post('/sign-up')
      .send(body);

    expect(response.status).toBe(201);
    expect(response.body.authToken).toEqual(expect.any(String));

    await userCreatedPromise;

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send({
        email: body.email,
        password: body.password,
      });

    expect(loginResponse.status).toBe(201);

    expect(loginResponse.body).toEqual({
      authToken: expect.any(String),
      user: response.body.user,
    });
  });
});
