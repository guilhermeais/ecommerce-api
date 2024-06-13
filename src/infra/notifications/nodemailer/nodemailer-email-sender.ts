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

  #templatesHtml: { [K in keyof EmailTemplatesMap]: string } = {
    'account-confirmation': `<!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f2f2f2;
                color: #333333;
                margin: 0;
                padding: 0;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 50px auto;
                background-color: #ffffff;
                border-radius: 10px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background-color: #007BFF;
                color: #ffffff;
                padding: 20px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
            }
            .content {
                padding: 30px;
                text-align: center;
            }
            .content h2 {
                font-size: 22px;
                margin-top: 0;
            }
            .content p {
                font-size: 16px;
                line-height: 1.6;
            }
            .button {
                display: inline-block;
                background-color: #007BFF;
                color: #ffffff;
                text-decoration: none;
                padding: 15px 25px;
                margin: 20px 0;
                border-radius: 5px;
                font-size: 16px;
            }
            .footer {
                background-color: #f2f2f2;
                color: #666666;
                padding: 20px;
                text-align: center;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Confirmação de Conta</h1>
            </div>
            <div class="content">
                <h2>Olá, {{name}}! 👋</h2>
                <p>Clique no botão abaixo para confirmar sua conta:</p>
                <a href="{{confirmationUrl}}" class="button">Confirmar Conta</a>
            </div>
            <div class="footer">
                <p>Se você não solicitou este email, por favor ignore esta mensagem.</p>
            </div>
        </div>
    </body>
    </html>
    `,
    'sign-up-invite': `<!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f2f2f2;
            color: #333333;
            margin: 0;
            padding: 0;
          }
          .container {
            width: 100%;
            max-width: 600px;
            margin: 50px auto;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background-color: #007bff;
            color: #ffffff;
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px;
            text-align: center;
          }
          .content h2 {
            font-size: 22px;
            margin-top: 0;
          }
          .content p {
            font-size: 16px;
            line-height: 1.6;
          }
          .button {
            display: inline-block;
            background-color: #007bff;
            color: #ffffff;
            text-decoration: none;
            padding: 15px 25px;
            margin: 20px 0;
            border-radius: 5px;
            font-size: 16px;
          }
          .footer {
            background-color: #f2f2f2;
            color: #666666;
            padding: 20px;
            text-align: center;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Convite para se juntar ao {{appName}} 🚀</h1>
          </div>
          <div class="content">
            <h2>Olá, {{guestName}}! 👋</h2>
            <p>
              Você foi convidado por <b>{{sentByName}}</b> para se juntar ao
              <b>{{appName}}</b> 🎉
            </p>
            <a href="{{finishSignUpUrl}}" class="button">Finalizar Cadastro</a>
          </div>
          <div class="footer">
            <p>Se você não solicitou este email, por favor ignore esta mensagem.</p>
          </div>
        </div>
      </body>
    </html>
    `,
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
