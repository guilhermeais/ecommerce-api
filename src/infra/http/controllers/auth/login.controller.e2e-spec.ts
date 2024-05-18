import { UserRepository } from '@/domain/auth/application/gateways/repositories/user-repository';
import { DefaultExceptionFilter } from '@/infra/http/filters/default-exception-filter.filter';

import { EventManager } from '@/core/types/events';
import { Encrypter } from '@/domain/auth/application/gateways/cryptography/encrypter';
import { InvalidLoginRequestError } from '@/domain/auth/application/use-cases/errors/invalid-login-request-error';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';
import { LoginBodyRequest } from './login.controller';

describe('ClientSignUp (E2E)', () => {
  let app: INestApplication;
  let userRepository: UserRepository;
  let eventManager: EventManager;
  let encrypter: Encrypter;
  let userFactory: UserFactory;

  beforeAll(async () => {
    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule, CryptographyModule],
      providers: [UserFactory],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalFilters(new DefaultExceptionFilter());

    userRepository = moduleRef.get(UserRepository);
    eventManager = moduleRef.get(EventManager);
    encrypter = moduleRef.get(Encrypter);
    userFactory = moduleRef.get(UserFactory);

    await app.init();
  });

  beforeEach(async () => {
    eventManager.clearSubscriptions();
    await userRepository.clear();
  });

  function makeLoginRequest(
    modifications?: Partial<LoginBodyRequest>,
  ): LoginBodyRequest {
    return {
      email: faker.internet.email(),
      password: faker.internet.password(),
      ...modifications,
    };
  }

  describe('[POST] /login', () => {
    it('should return the accessToken and the logged user', async () => {
      const { user, plainPassword } = await userFactory.makeUser();

      const body = makeLoginRequest({
        email: user.email.value,
        password: plainPassword,
      });

      const response = await request(app.getHttpServer())
        .post('/login')
        .send(body);

      expect(response.status).toBe(201);

      expect(response.body).toEqual({
        authToken: expect.any(String),
        user: {
          id: user.id.toString(),
          email: user.email.value,
          name: user.name,
          phone: user.phone,
          role: user.role,
          isConfirmed: user.isConfirmed,
          address: user.address?.toObject(),
          cpf: user.cpf.value,
        },
      });

      const authToken = response.body.authToken;
      expect(await encrypter.decode(authToken)).toEqual<UserPayload>({
        sub: user.id.toString(),
        iat: expect.any(Number),
      });
    });

    describe('Exceptions', () => {
      it('should return invalid login request if the email is not registered', async () => {
        const body = makeLoginRequest();

        const response = await request(app.getHttpServer())
          .post('/login')
          .send(body);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          statusCode: 400,
          message: [new InvalidLoginRequestError().message],
          error: InvalidLoginRequestError.name,
          details: new InvalidLoginRequestError().details,
        });
      });

      it('should return invalid login request if the password does not match', async () => {
        const { user } = await userFactory.makeUser();

        const body = makeLoginRequest({
          email: user.email.value,
          password: 'wrong-password',
        });

        const response = await request(app.getHttpServer())
          .post('/login')
          .send(body);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          statusCode: 400,
          message: [new InvalidLoginRequestError().message],
          error: InvalidLoginRequestError.name,
          details: new InvalidLoginRequestError().details,
        });
      });

      it.each([
        {
          body: makeLoginRequest({ email: null as any }),
          expectedResponse: {
            statusCode: 400,
            message: ['Email é obrigatório!'],
            error: 'BadRequestException',
          },
          expectedStatus: 400,
        },
        {
          body: makeLoginRequest({ password: null as any }),
          expectedResponse: {
            statusCode: 400,
            message: ['Senha é obrigatória!'],
            error: 'BadRequestException',
          },
          expectedStatus: 400,
        },
      ] as {
        body: LoginBodyRequest;
        expectedStatus: number;
        expectedResponse: any;
      }[])(
        'should return $expectedStatus when signup with $body',
        async ({ body, expectedStatus, expectedResponse }) => {
          const response = await request(app.getHttpServer())
            .post('/login')
            .send(body);

          expect(response.status).toBe(expectedStatus);
          expect(response.body).toEqual(expectedResponse);
        },
      );
    });
  });
});
