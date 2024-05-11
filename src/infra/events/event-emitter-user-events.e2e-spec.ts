import { EventManager, Events } from '@/core/types/events';
import { INestApplication } from '@nestjs/common';
import { makeUser } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-app';
import { EventEmitterEventManager } from './event-emitter-user-events';

describe('EventEmitterEventManager', () => {
  let sut: EventEmitterEventManager;
  let app: INestApplication;

  beforeAll(async () => {
    const module = await makeTestingApp().compile();
    app = module.createNestApplication();
    await app.init();
    sut = app.get(EventManager);
  });

  beforeEach(() => {
    sut.clearSubscriptions();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should subscribe and publish to user.created event', async () => {
    const callback = vitest.fn();
    sut.subscribe(Events.USER_CREATED, callback);

    const user = makeUser();
    await sut.publish(Events.USER_CREATED, user);

    expect(callback).toHaveBeenCalledWith(user);
  });
});
