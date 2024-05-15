import { EventManager, Events } from '@/core/types/events';
import { INestApplication } from '@nestjs/common';
import { makeTestingApp } from 'test/make-app';
import { EmailSender } from '../gateways/notifications/email-sender';
import { makeConfirmationToken } from 'test/auth/enterprise/entities/make-confirmation-token';
import { faker } from '@faker-js/faker';
import { Email } from '@/domain/auth/enterprise/entities/value-objects/email';
import { setTimeout } from 'timers/promises';

describe('OnConfirmationTokenCreated E2E', () => {
  let app: INestApplication;
  let eventManager: EventManager;
  let emailSender: EmailSender;

  beforeEach(async () => {
    app = (await makeTestingApp().compile()).createNestApplication();
    eventManager = app.get(EventManager);
    emailSender = app.get(EmailSender);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should send a email confirmation when a new confirmation token is generated', async () => {
    const email = Email.create(faker.internet.email());
    const name = faker.person.fullName();
    await eventManager.publish(
      Events.CONFIRMATION_TOKEN_CREATED,
      makeConfirmationToken({
        email,
        userName: name,
      }),
    );

    await setTimeout(50);

    const sentEmails = await emailSender.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].request.to).toBe(email.value);
    expect(sentEmails[0].request.template).toBe('account-confirmation');
  });
});
