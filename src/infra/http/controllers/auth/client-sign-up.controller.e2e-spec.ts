import { UsersRepository } from '@/domain/auth/application/gateways/repositories/user-repository';
import { DefaultExceptionFilter } from '@/infra/http/filters/default-exception-filter.filter';

import { EventManager, Events } from '@/core/types/events';
import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { User } from '@/domain/auth/enterprise/entities/user';
import { Email } from '@/domain/auth/enterprise/entities/value-objects/email';
import { InvalidCPFError } from '@/domain/auth/enterprise/entities/value-objects/errors/invalid-cpf-error';
import { InvalidEmailFormatError } from '@/domain/auth/enterprise/entities/value-objects/errors/invalid-email-format-error';
import { InvalidPasswordError } from '@/domain/auth/enterprise/entities/value-objects/errors/invalid-password-error';
import { DatabaseModule } from '@/infra/database/database.module';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { makeSignUpBody } from 'test/infra/http/controllers/auth/sign-up-body.mock';
import { makeTestingApp } from 'test/make-testing-app';
import { SignUpBody } from './client-sign-up.controller';

describe('ClientSignUp (E2E)', () => {
  let app: INestApplication;
  let userRepository: UsersRepository;
  let eventManager: EventManager;

  beforeAll(async () => {
    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalFilters(new DefaultExceptionFilter());

    userRepository = moduleRef.get(UsersRepository);

    eventManager = moduleRef.get(EventManager);
    eventManager.clearSubscriptions();
    await app.init();
  });

  beforeEach(async () => {
    await userRepository.clear();
  });

  describe('[POST] /sign-up', () => {
    it('should create an user account', async () => {
      const body = makeSignUpBody();

      const userCreatedEventPromise = new Promise<User>((resolve) => {
        eventManager.subscribe(Events.USER_CREATED, resolve);
      });

      const response = await request(app.getHttpServer())
        .post('/sign-up')
        .send(body);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          authToken: expect.any(String),
          user: expect.objectContaining({
            id: expect.any(String),
            email: body.email,
            name: body.name,
            cpf: body.cpf,
            phone: body.phone,
            address: body.address,
          }),
        }),
      );

      const user = await userRepository.findByEmail(Email.create(body.email));
      expect(user).toBeDefined();
      expect(user!.email.value).toBe(body.email);
      expect(user!.name).toBe(body.name);
      expect(user!.cpf.value).toBe(body.cpf);
      expect(user!.phone).toBe(body.phone);
      expect(user!.address?.toObject()).toEqual(body.address);
      expect(user!.isConfirmed).toBe(false);
      expect(user!.role).toEqual(Role.USER);

      const userCreatedEvent = await userCreatedEventPromise;
      expect(userCreatedEvent.id.toValue()).toBe(user!.id.toValue());
    });

    describe('Exceptions', () => {
      it.each([
        {
          body: makeSignUpBody({ email: null as any }),
          expectedResponse: {
            statusCode: 400,
            message: ['Email é obrigatório!'],
            error: 'BadRequestException',
          },
          expectedStatus: 400,
        },
        {
          body: makeSignUpBody({ email: 'invalid-email' as any }),
          expectedResponse: {
            statusCode: 400,
            message: [new InvalidEmailFormatError('invalid-email').message],
            details: new InvalidEmailFormatError('invalid-email').details,
            error: InvalidEmailFormatError.name,
          },
          expectedStatus: 400,
        },
        {
          body: makeSignUpBody({ password: 'invalid-pass' as any }),
          expectedResponse: {
            statusCode: 400,
            message: [new InvalidPasswordError('invalid-pass').message],
            details: new InvalidPasswordError('invalid-pass').details,
            error: InvalidPasswordError.name,
          },
          expectedStatus: 400,
        },
        {
          body: makeSignUpBody({ cpf: 'invalid-cpf' as any }),
          expectedResponse: {
            statusCode: 400,
            message: [new InvalidCPFError('invalid-cpf').message],
            details: new InvalidCPFError('invalid-cpf').details,
            error: InvalidCPFError.name,
          },
          expectedStatus: 400,
        },
      ] as {
        body: SignUpBody;
        expectedStatus: number;
        expectedResponse: any;
      }[])(
        'should return $expectedStatus when signup with $body',
        async ({ body, expectedStatus, expectedResponse }) => {
          const response = await request(app.getHttpServer())
            .post('/sign-up')
            .send(body);

          expect(response.status).toBe(expectedStatus);
          expect(response.body).toEqual(expectedResponse);
        },
      );
    });
  });
});
