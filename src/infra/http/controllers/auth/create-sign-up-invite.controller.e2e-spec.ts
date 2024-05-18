import { DefaultExceptionFilter } from '@/infra/http/filters/default-exception-filter.filter';

import { EventManager } from '@/core/types/events';
import { SignUpInvitesRepository } from '@/domain/auth/application/gateways/repositories/sign-up-invites.repository';
import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';
import { CreateSignUpInviteBody } from './create-sign-up-invite.controller';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { InvalidEmailFormatError } from '@/domain/auth/enterprise/entities/value-objects/errors/invalid-email-format-error';

describe('CreateSignUpInviteController (E2E)', () => {
  let app: INestApplication;
  let signUpInvitesRepository: SignUpInvitesRepository;
  let eventManager: EventManager;
  let userFactory: UserFactory;

  beforeAll(async () => {
    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule, CryptographyModule],
      providers: [UserFactory],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalFilters(new DefaultExceptionFilter());

    signUpInvitesRepository = moduleRef.get(SignUpInvitesRepository);
    eventManager = moduleRef.get(EventManager);
    userFactory = moduleRef.get(UserFactory);

    await app.init();
  });

  beforeEach(async () => {
    eventManager.clearSubscriptions();
    await signUpInvitesRepository.clear();
  });

  function makeCreateSignUpInviteRequest(
    modifications?: Partial<CreateSignUpInviteBody>,
  ): CreateSignUpInviteBody {
    return {
      email: faker.internet.email(),
      name: faker.person.fullName(),
      ...modifications,
    };
  }

  describe('[POST] /admin/sign-up/invites', () => {
    it('should create a sign up invite', async () => {
      const { user } = await userFactory.makeUser({
        role: Role.MASTER,
      });

      const accessToken = await userFactory.generateAccessToken(user);

      const body = makeCreateSignUpInviteRequest();

      const response = await request(app.getHttpServer())
        .post('/admin/sign-up/invites')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(body);

      expect(response.status).toBe(201);
      expect(response.body.signUpInviteId).toBeTypeOf('string');

      const { signUpInviteId } = response.body;

      const signUpinvite = await signUpInvitesRepository.findById(
        new UniqueEntityID(signUpInviteId),
      );

      expect(signUpinvite).toBeDefined();
      expect(signUpinvite!.guestEmail.value).toBe(body.email);
      expect(signUpinvite!.guestName).toBe(body.name);
      expect(signUpinvite!.sentBy.id.toString()).toBe(user.id.toString());
    });

    describe('Exceptions', () => {
      it('should return Forbidden if the user is not a master', async () => {
        const { user } = await userFactory.makeUser({
          role: Role.USER,
        });

        const accessToken = await userFactory.generateAccessToken(user);

        const body = makeCreateSignUpInviteRequest();

        const response = await request(app.getHttpServer())
          .post('/admin/sign-up/invites')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(body);

        expect(response.status).toBe(403);
        expect(response.body.message).toEqual('Forbidden resource');
        expect(response.body.error).toEqual('ForbiddenException');
      });

      it('should return InvalidEmailFormatError if the provided email is invalid', async () => {
        const { user } = await userFactory.makeUser({
          role: Role.MASTER,
        });

        const accessToken = await userFactory.generateAccessToken(user);

        const body = makeCreateSignUpInviteRequest({
          email: 'invalid-email',
        });

        const response = await request(app.getHttpServer())
          .post('/admin/sign-up/invites')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(body);

        expect(response.status).toBe(400);
        expect(response.body.message).toEqual([
          new InvalidEmailFormatError(body.email).message,
        ]);
        expect(response.body.details).toEqual(
          new InvalidEmailFormatError(body.email).details,
        );
        expect(response.body.error).toEqual(InvalidEmailFormatError.name);
      });
    });
  });
});
