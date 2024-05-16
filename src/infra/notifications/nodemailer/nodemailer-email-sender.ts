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
import { Transporter } from 'nodemailer';
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

  #templates: {
    [K in keyof EmailTemplatesMap]: (data: EmailTemplatesMap[K]) => string;
  } = {
    'account-confirmation': (data) => {
      return `
        <h1>Confirmação de Conta</h1>
        <p>Olá, ${data.name}!</p>
        <p> Clique no botão abaixo para confirmar sua conta </p>
        <a href="${data.confirmationUrl}">Confirmar Conta</a>
      `;
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
        to: 'guilhermeteixeiraais@gmail.com',
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
