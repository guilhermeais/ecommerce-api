import { UsersRepository } from '@/domain/auth/application/gateways/repositories/user-repository';
import { DefaultExceptionFilter } from '@/infra/http/filters/default-exception-filter.filter';

import { EventManager } from '@/core/types/events';
import { Encrypter } from '@/domain/auth/application/gateways/cryptography/encrypter';
import { ConfirmationTokensRepository } from '@/domain/auth/application/gateways/repositories/confirmation-tokens-repository';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { DatabaseModule } from '@/infra/database/database.module';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { makeConfirmationToken } from 'test/auth/enterprise/entities/make-confirmation-token';
import { makeUser } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';
import { randomUUID } from 'crypto';

describe('ConfirmAccountController (E2E)', () => {
  let app: INestApplication;
  let userRepository: UsersRepository;
  let confirmationTokensRepository: ConfirmationTokensRepository;
  let eventManager: EventManager;
  let encrypter: Encrypter;

  beforeAll(async () => {
    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalFilters(new DefaultExceptionFilter());

    userRepository = moduleRef.get(UsersRepository);
    confirmationTokensRepository = moduleRef.get(ConfirmationTokensRepository);
    eventManager = moduleRef.get(EventManager);
    encrypter = moduleRef.get(Encrypter);

    await app.init();
  });

  beforeEach(async () => {
    eventManager.clearSubscriptions();
    await userRepository.clear();
    await confirmationTokensRepository.clear();
  });

  describe('[POST] /sign-up/:confirmationId/confirm', () => {
    it('should confirm an user account', async () => {
      const user = makeUser();
      const accessToken = await encrypter.encrypt<UserPayload>({
        sub: user.id.toString(),
      });

      await userRepository.save(user);
      const confirmationToken = makeConfirmationToken({
        userId: user.id,
        userName: user.name,
        email: user.email,
        createdAt: new Date(),
        expiresIn: 100000,
      });
      await confirmationTokensRepository.save(confirmationToken);

      expect(user.isConfirmed).toBe(false);
      expect(confirmationToken.used).toBe(false);

      const response = await request(app.getHttpServer())
        .post(`/sign-up/${confirmationToken.id.toString()}/confirm`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(201);

      const updatedUser = await userRepository.findById(user.id);
      expect(updatedUser!.isConfirmed).toBe(true);

      const updatedConfirmationToken =
        await confirmationTokensRepository.findById(confirmationToken.id);

      expect(updatedConfirmationToken!.used).toBe(true);
    });

    it('should return unauthorized if the confirmation token is expired', async () => {
      const user = makeUser();
      const accessToken = await encrypter.encrypt<UserPayload>({
        sub: user.id.toString(),
      });
      await userRepository.save(user);
      const confirmationToken = makeConfirmationToken({
        userId: user.id,
        userName: user.name,
        email: user.email,
        createdAt: new Date(),
        expiresIn: -1,
      });
      await confirmationTokensRepository.save(confirmationToken);

      expect(user.isConfirmed).toBe(false);
      expect(confirmationToken.isExpired()).toBe(true);

      const response = await request(app.getHttpServer())
        .post(`/sign-up/${confirmationToken.id.toString()}/confirm`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(401);

      const updatedUser = await userRepository.findById(user.id);
      expect(updatedUser!.isConfirmed).toBe(false);
    });

    it('should return InvalidConfirmationTokenError if the user tries to confirm a token that does not belongs to him', async () => {
      const user = makeUser();
      const anotherUser = makeUser();

      await Promise.all(
        [user, anotherUser].map((user) => userRepository.save(user)),
      );

      const confirmationToken = makeConfirmationToken({
        userId: user.id,
        userName: user.name,
        email: user.email,
        createdAt: new Date(),
        expiresIn: 100000,
      });
      await confirmationTokensRepository.save(confirmationToken);

      const accessToken = await encrypter.encrypt<UserPayload>({
        sub: anotherUser.id.toString(),
      });

      const response = await request(app.getHttpServer())
        .post(`/sign-up/${confirmationToken.id.toString()}/confirm`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(400);

      const updatedUser = await userRepository.findById(user.id);
      expect(updatedUser!.isConfirmed).toBe(false);
    });

    it('should return 404 if confirmation token does not exists', async () => {
      const user = makeUser();
      const accessToken = await encrypter.encrypt<UserPayload>({
        sub: user.id.toString(),
      });
      await userRepository.save(user);

      const response = await request(app.getHttpServer())
        .post(`/sign-up/${randomUUID()}/confirm`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(404);
    });
  });
});
