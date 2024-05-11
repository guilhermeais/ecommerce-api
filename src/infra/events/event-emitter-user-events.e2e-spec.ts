import { INestApplication } from '@nestjs/common';
import { EventEmitterUserEvents } from './event-emitter-user-events';
import { makeTestingApp } from 'test/make-app';
import { makeUser } from 'test/auth/enterprise/entities/make-user';
import {
  UserEvents,
  UserEventsEnum,
} from '@/domain/auth/application/gateways/events/user-events';

describe('EventEmitterUserEvents', () => {
  let sut: EventEmitterUserEvents;
  let app: INestApplication;

  beforeAll(async () => {
    const module = await makeTestingApp().compile();
    app = module.createNestApplication();
    await app.init();
    sut = app.get(UserEvents);
  });

  beforeEach(() => {
    sut.clearSubscriptions();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should subscribe and publish to user.created event', async () => {
    const callback = vitest.fn();
    sut.subscribe(UserEventsEnum.USER_CREATED, callback);

    const user = makeUser();
    await sut.publish(UserEventsEnum.USER_CREATED, user);

    expect(callback).toHaveBeenCalledWith(user);
  });
});
