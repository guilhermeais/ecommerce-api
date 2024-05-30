import { EventManager } from '@/core/types/events';
import { SignUpInvitesRepository } from '@/domain/auth/application/gateways/repositories/sign-up-invites.repository';
import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SignUpInviteFactory } from 'test/auth/enterprise/entities/make-sign-up-invite';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';
import { DefaultExceptionFilter } from '../../filters/default-exception-filter.filter';
import { ListSignUpInvitesQuery } from './list-sign-up-invites.controller';
import { SignUpInvitePresenter } from '../presenters/sign-up-invite-presenter';

export function makeListSignUpInvitesQuery(
  modifications?: Partial<ListSignUpInvitesQuery>,
): ListSignUpInvitesQuery {
  return {
    limit: 10,
    page: 1,
    ...modifications,
  };
}

describe('ListSignUpInvitesController (E2E)', () => {
  let app: INestApplication;
  let signUpInvitesRepository: SignUpInvitesRepository;
  let eventManager: EventManager;
  let userFactory: UserFactory;
  let signUpInviteFactory: SignUpInviteFactory;

  beforeAll(async () => {
    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule, CryptographyModule],
      providers: [UserFactory, SignUpInviteFactory],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalFilters(new DefaultExceptionFilter());

    signUpInvitesRepository = moduleRef.get(SignUpInvitesRepository);
    eventManager = moduleRef.get(EventManager);
    userFactory = moduleRef.get(UserFactory);
    signUpInviteFactory = moduleRef.get(SignUpInviteFactory);

    await app.init();
  });

  beforeEach(async () => {
    eventManager.clearSubscriptions();
    await signUpInvitesRepository.clear();
  });

  describe('[GET] /admin/sign-up/invites', () => {
    it('should list empty sign up invites', async () => {
      const { accessToken } = await userFactory.makeUser({
        role: Role.MASTER,
      });

      const query = makeListSignUpInvitesQuery();

      const response = await request(app.getHttpServer())
        .get('/admin/sign-up/invites')
        .set('Authorization', `Bearer ${accessToken}`)
        .query(query);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        total: 0,
        items: [],
        pages: 0,
        currentPage: 1,
        limit: 10,
      });
    });

    it('should paginate the existing sign up invites', async () => {
      const { accessToken } = await userFactory.makeUser({
        role: Role.MASTER,
      });

      const signupInvites = await Promise.all(
        Array.from({ length: 15 }).map((_, i) =>
          signUpInviteFactory.makeSignUpInvite({
            createdAt: new Date(2021, 1, i + 1),
          }),
        ),
      );

      const query = makeListSignUpInvitesQuery({
        limit: 5,
        page: 1,
      });

      const response = await request(app.getHttpServer())
        .get('/admin/sign-up/invites')
        .set('Authorization', `Bearer ${accessToken}`)
        .query(query);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        total: 15,
        pages: 3,
        currentPage: 1,
        limit: 5,
      });

      expect(response.body.items).toHaveLength(5);

      expect(response.body.items).toEqual(
        signupInvites.slice(0, 5).map(SignUpInvitePresenter.toHTTP),
      );

      const lastPage = await request(app.getHttpServer())
        .get('/admin/sign-up/invites')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          ...query,
          page: 3,
        });

      expect(lastPage.status).toBe(200);

      expect(lastPage.body).toMatchObject({
        total: 15,
        pages: 3,
        currentPage: 3,
        limit: 5,
      });

      expect(lastPage.body.items).toHaveLength(5);
    });
  });
});
