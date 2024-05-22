import { INestApplication } from '@nestjs/common';
import { makeTestingApp } from 'test/make-testing-app';

import { EventManager, Events } from '@/core/types/events';
import { makeUser } from 'test/auth/enterprise/entities/make-user';
import { ConfirmationTokensRepository } from '../gateways/repositories/confirmation-tokens-repository';
import { UsersRepository } from '../gateways/repositories/user-repository';

describe('OnUserCreated E2E', () => {
  let app: INestApplication;
  let eventManager: EventManager;
  let userRepository: UsersRepository;
  let confirmationTokensRepository: ConfirmationTokensRepository;

  beforeAll(async () => {
    app = (await makeTestingApp().compile()).createNestApplication();

    eventManager = app.get(EventManager);
    userRepository = app.get(UsersRepository);
    confirmationTokensRepository = app.get(ConfirmationTokensRepository);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should generate a confirmation token', async () => {
    const user = makeUser();

    await userRepository.save(user);

    const testFinishPromise = new Promise<void>((resolve) => {
      eventManager.subscribe(
        Events.CONFIRMATION_TOKEN_CREATED,
        async (confirmationToken) => {
          expect(confirmationToken.userId.equals(user.id)).toBeTruthy();

          const found = await confirmationTokensRepository.findById(
            confirmationToken.id,
          );

          expect(found).toBeDefined();

          expect(found?.userId.equals(user.id)).toBeTruthy();
          resolve();
        },
      );
    });

    await eventManager.publish(Events.USER_CREATED, user);

    await testFinishPromise;
  });
});
