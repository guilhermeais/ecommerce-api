import { DefaultExceptionFilter } from '@/infra/http/filters/default-exception-filter.filter';

import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';
import { UserPresenter } from './presenters/user-presenter';

describe('GetLoggedUserController (E2E)', () => {
  let app: INestApplication;
  let userFactory: UserFactory;

  beforeAll(async () => {
    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule, CryptographyModule],
      providers: [UserFactory],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalFilters(new DefaultExceptionFilter());

    userFactory = moduleRef.get(UserFactory);

    await app.init();
  });

  describe('[GET] /user', () => {
    it('should get the logged user', async () => {
      const { user, accessToken } = await userFactory.makeUser();

      const response = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual(UserPresenter.toHTTP(user));
    });

    it('should return 401 if the user is not logged', async () => {
      await request(app.getHttpServer()).get('/user').expect(401);
    });
  });
});
