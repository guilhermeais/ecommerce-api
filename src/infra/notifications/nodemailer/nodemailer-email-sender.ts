import {
  EmailSender,
  EmailSenderRequest,
  EmailSenderResponse,
  SentEmail,
} from '@/domain/notifications/application/gateways/notifications/email-sender';
import { EmailTemplatesMap } from '@/domain/notifications/application/gateways/notifications/email-templates';
import { EnvService } from '@/infra/env/env.service';
import { Logger } from '@/shared/logger';
import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { Transporter } from 'nodemailer';
import path from 'path';
import { InvalidEmailTemplateError } from './errors/invalid-email-template-error';
import { NODE_MAILER_TRANSPORT } from './transporter-factory';
@Injectable()
export class NodeMailerEmailSender implements EmailSender {
  constructor(
    @Inject(NODE_MAILER_TRANSPORT)
    private readonly transporter: Transporter,
    private readonly env: EnvService,
    private readonly logger: Logger,
  ) {}

  #sentEmails: SentEmail[] = [];

  #templatesHtml: { [K in keyof EmailTemplatesMap]: string } = {
    'account-confirmation': readFileSync(
      path.join(__dirname, 'templates/account-confirmation-template.html'),
      'utf8',
    ),
    'sign-up-invite': readFileSync(
      path.join(__dirname, 'templates/sign-up-invite-template.html'),
      'utf8',
    ),
  };

  #templates: {
    [K in keyof EmailTemplatesMap]: (data: EmailTemplatesMap[K]) => string;
  } = {
    'account-confirmation': (data) => {
      const confirmationUrl = `${this.env.get('ACCOUNT_CONFIRMATION_URL')}?confirmationId=${data.confirmationId}`;
      const variables = {
        name: data.name,
        confirmationUrl,
      };
      let template = this.#templatesHtml['account-confirmation'];

      Object.entries(variables).forEach(([key, value]) => {
        template = template.replaceAll(`{{${key}}}`, value.toString());
      });
      return template;
    },
    'sign-up-invite': (data) => {
      const finishSignUpUrl = `${this.env.get('FINISH_SIGNUP_INVITE_URL')}?inviteId=${data.inviteId}`;
      const variables = {
        sentByName: data.sentByName,
        guestName: data.guestName,
        finishSignUpUrl,
        appName: this.env.get('APP_NAME'),
      };

      let template = this.#templatesHtml['sign-up-invite'];

      Object.entries(variables).forEach(([key, value]) => {
        template = template.replaceAll(`{{${key}}}`, value.toString());
      });

      return template;
    },
  };

  async send<K extends keyof EmailTemplatesMap>(
    request: EmailSenderRequest<K>,
  ): Promise<EmailSenderResponse> {
    const messageId = randomUUID();
    this.logger.log(
      NodeMailerEmailSender.name,
      `Sending email ${messageId}: ${JSON.stringify(request, null, 2)}`,
    );

    let response: EmailSenderResponse = {
      messageId,
      status: 'failed',
      response: '',
    };
    try {
      const template = this.#templates[request.template];

      if (!template) {
        this.logger.warn(
          NodeMailerEmailSender.name,
          `Template ${request.template} not implemented!`,
        );
        throw new InvalidEmailTemplateError(request.template);
      }

      const html = template(request.contentObject);

      this.logger.debug(
        NodeMailerEmailSender.name,
        `Email ${messageId} with template ${request.template} content: ${html}`,
      );

      const info = await this.transporter.sendMail({
        from: this.env.get('APP_EMAIL'),
        subject: request.subject,
        to: request.to,
        html,
        messageId,
      });

      this.logger.debug(
        NodeMailerEmailSender.name,
        `Email ${messageId} sent with info: ${JSON.stringify(info, null, 2)}`,
      );

      response = {
        messageId,
        status: 'sent',
        response: info?.response,
      };
    } catch (error: any) {
      response = { status: 'failed', response: error.message, messageId };
    }

    this.#sentEmails.push({
      request,
      ...response,
    });

    this.logger.log(
      NodeMailerEmailSender.name,
      `Email ${messageId} sent with response: ${JSON.stringify(response, null, 2)}`,
    );

    return response;
  }

  async getSentEmails(): Promise<SentEmail[]> {
    return this.#sentEmails;
  }
}
