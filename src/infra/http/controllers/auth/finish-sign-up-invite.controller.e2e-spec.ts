import { UserRepository } from '@/domain/auth/application/gateways/repositories/user-repository';
import { DefaultExceptionFilter } from '@/infra/http/filters/default-exception-filter.filter';

import { EventManager } from '@/core/types/events';
import { SignUpInvitesRepository } from '@/domain/auth/application/gateways/repositories/sign-up-invites.repository';
import { DatabaseModule } from '@/infra/database/database.module';
import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { cpf } from 'cpf-cnpj-validator';
import request from 'supertest';
import { makeSignUpInvite } from 'test/auth/enterprise/entities/make-sign-up-invite';
import { makeTestingApp } from 'test/make-testing-app';
import {
  FinishSignUpInviteBody,
  FinishSignUpInviteResponse,
} from './finish-sign-up-invite.controller';
import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { InvalidCPFError } from '@/domain/auth/enterprise/entities/value-objects/errors/invalid-cpf-error';
import { InvalidPasswordError } from '@/domain/auth/enterprise/entities/value-objects/errors/invalid-password-error';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { SignUpInviteExpiredError } from '@/domain/auth/application/use-cases/errors/signup-invite-expired-error';
import { CPF } from '@/domain/auth/enterprise/entities/value-objects/cpf';

export function makeFinishSignUpInviteBody(
  overrides?: Partial<FinishSignUpInviteBody>,
): FinishSignUpInviteBody {
  return {
    cpf: cpf.generate(),
    name: faker.person.fullName(),
    password: 'aA@123456',
    ...overrides,
  };
}

describe('FinishSignUpInviteController (E2E)', () => {
  let app: INestApplication;
  let userRepository: UserRepository;
  let signUpInvitesRepository: SignUpInvitesRepository;
  let eventManager: EventManager;

  beforeAll(async () => {
    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalFilters(new DefaultExceptionFilter());

    userRepository = moduleRef.get(UserRepository);
    signUpInvitesRepository = moduleRef.get(SignUpInvitesRepository);

    eventManager = moduleRef.get(EventManager);
    await app.init();
  });

  beforeEach(async () => {
    eventManager.clearSubscriptions();
    await userRepository.clear();
  });

  describe('[POST] /admin/sign-up/invites/:inviteId/finish', () => {
    it('should finish a valid signup invite', async () => {
      const invite = makeSignUpInvite();

      await userRepository.save(invite.sentBy);
      await signUpInvitesRepository.save(invite);

      const body = makeFinishSignUpInviteBody();

      const response = await request(app.getHttpServer())
        .post(`/admin/sign-up/invites/${invite.id.toString()}/finish`)
        .send(body);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('authToken');
      expect(response.body).toHaveProperty('user');

      const responseBody = response.body as FinishSignUpInviteResponse;

      expect(responseBody.user.email).toBe(invite.guestEmail.value);
      expect(responseBody.user.name).toBe(body.name);

      const userFromDatabase = await userRepository.findByEmail(
        invite.guestEmail,
      );

      expect(userFromDatabase).toBeDefined();
      expect(userFromDatabase?.signUpInviteId).toEqual(invite.id);

      expect(userFromDatabase!.email.value).toBe(invite.guestEmail.value);
      expect(userFromDatabase!.name).toBe(body.name);
      expect(userFromDatabase!.id.toString()).toBe(responseBody.user.id);
      expect(userFromDatabase!.role).toBe(Role.ADMIN);
      expect(userFromDatabase!.isConfirmed).toBe(true);

      const inviteFromDatabase = await signUpInvitesRepository.findById(
        invite.id,
      );

      expect(inviteFromDatabase?.isFinished()).toEqual(true);
    });

    describe('Exceptions', () => {
      it('should return 404 if the invite does not exists', async () => {
        const body = makeFinishSignUpInviteBody();

        const response = await request(app.getHttpServer())
          .post(`/admin/sign-up/invites/invalid-id/finish`)
          .send(body);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
          statusCode: 404,
          message: [
            new EntityNotFoundError('Convite de Cadastro', 'invalid-id')
              .message,
          ],
          details: new EntityNotFoundError('Convite de Cadastro', 'invalid-id')
            .details,
          error: EntityNotFoundError.name,
        });
      });

      it('should return 410 if the invite is expired', async () => {
        const invite = makeSignUpInvite({
          expiresIn: -1,
        });
        await userRepository.save(invite.sentBy);
        await signUpInvitesRepository.save(invite);

        const body = makeFinishSignUpInviteBody();

        const response = await request(app.getHttpServer())
          .post(`/admin/sign-up/invites/${invite.id.toString()}/finish`)
          .send(body);

        expect(response.status).toBe(410);
        expect(response.body).toEqual({
          statusCode: 410,
          message: [new SignUpInviteExpiredError(invite).message],
          details: new SignUpInviteExpiredError(invite).details,
          error: SignUpInviteExpiredError.name,
        });
      });

      it('should return 410 if the invite is finished', async () => {
        const invite = makeSignUpInvite();
        invite.finishSignUp({
          cpf: CPF.create(cpf.generate()),
          name: faker.person.fullName(),
          password: 'aA@123456',
        });

        await userRepository.save(invite.sentBy);
        await signUpInvitesRepository.save(invite);

        const body = makeFinishSignUpInviteBody();

        const response = await request(app.getHttpServer())
          .post(`/admin/sign-up/invites/${invite.id.toString()}/finish`)
          .send(body);

        expect(response.status).toBe(410);
        expect(response.body).toEqual({
          statusCode: 410,
          message: [new SignUpInviteExpiredError(invite).message],
          details: new SignUpInviteExpiredError(invite).details,
          error: SignUpInviteExpiredError.name,
        });
      });

      it.each([
        {
          body: makeFinishSignUpInviteBody({ cpf: 'invalid-cpf' }),
          expectedResponse: {
            statusCode: 400,
            message: [new InvalidCPFError('invalid-cpf').message],
            error: InvalidCPFError.name,
            details: new InvalidCPFError('invalid-cpf').details,
          },
          expectedStatus: 400,
        },
        {
          body: makeFinishSignUpInviteBody({ password: 'invalid-pass' }),
          expectedResponse: {
            statusCode: 400,
            message: [new InvalidPasswordError('invalid-pass').message],
            details: new InvalidPasswordError('invalid-pass').details,
            error: InvalidPasswordError.name,
          },
          expectedStatus: 400,
        },
      ] as {
        body: FinishSignUpInviteBody;
        expectedStatus: number;
        expectedResponse: any;
      }[])(
        'should return $expectedStatus when signup with $body',
        async ({ body, expectedStatus, expectedResponse }) => {
          const invite = makeSignUpInvite();

          await userRepository.save(invite.sentBy);
          await signUpInvitesRepository.save(invite);

          const response = await request(app.getHttpServer())
            .post(`/admin/sign-up/invites/${invite.id.toString()}/finish`)
            .send(body);

          expect(response.status).toBe(expectedStatus);
          expect(response.body).toEqual(expectedResponse);
        },
      );
    });
  });
});
