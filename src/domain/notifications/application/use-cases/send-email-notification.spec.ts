import { FakeEmailSender } from '@/infra/notifications/fake-email-sender';
import { faker } from '@faker-js/faker';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { EmailSender } from '../gateways/notificaitons/email-sender';
import {
  SendEmailNotificationRequest,
  SendEmailNotificationUseCase,
} from './send-email-notification';

describe('SendEmailNotification', () => {
  let sut: SendEmailNotificationUseCase;
  let emailSender: EmailSender;

  beforeEach(() => {
    emailSender = new FakeEmailSender();
    sut = new SendEmailNotificationUseCase(emailSender, makeFakeLogger());
  });

  function makeRequest(
    modifications?: Partial<SendEmailNotificationRequest>,
  ): SendEmailNotificationRequest {
    return {
      to: faker.internet.email(),
      subject: faker.lorem.sentence(),
      template: 'account-confirmation',
      contentObject: {},
      ...modifications,
    };
  }

  it('should send a email', async () => {
    const request = makeRequest();
    await sut.execute(request);

    const sentEmails = await emailSender.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].request.to).toBe(request.to);
    expect(sentEmails[0].request.template).toBe(request.template);
  });
});
