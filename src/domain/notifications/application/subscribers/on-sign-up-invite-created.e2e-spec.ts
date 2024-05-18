import { EventManager, Events } from '@/core/types/events';
import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { Email } from '@/domain/auth/enterprise/entities/value-objects/email';
import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { makeSignUpInvite } from 'test/auth/enterprise/entities/make-sign-up-invite';
import { makeUser } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';
import { setTimeout } from 'timers/promises';
import { EmailSender } from '../gateways/notifications/email-sender';
import { EmailTemplate } from '../gateways/notifications/email-templates';

describe('OnSignUpInviteCreated E2E', () => {
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

  it('should send a email with the signup invite when a signup invite is generated', async () => {
    const guestEmail = Email.create(faker.internet.email());
    const guestName = faker.person.fullName();
    const sentByName = faker.person.fullName();
    const invite = makeSignUpInvite({
      guestEmail,
      guestName,
      sentBy: makeUser({
        name: sentByName,
        role: Role.MASTER,
      }),
    });

    await eventManager.publish(Events.SIGN_UP_INVITE_CREATED, invite);

    await setTimeout(100);

    const sentEmails = await emailSender.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].request.to).toBe(guestEmail.value);
    expect(sentEmails[0].request.template).toBe(EmailTemplate.SignUpInvite);
    expect(sentEmails[0].request.contentObject.inviteId).toBe(
      invite.id.toString(),
    );
  });
});
