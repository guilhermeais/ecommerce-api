import { EnvService } from '@/infra/env/env.service';
import { Logger } from '@/shared/logger';
import { Provider, Scope } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import SMTPConnection from 'nodemailer/lib/smtp-connection';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
export const NODE_MAILER_TRANSPORT = Symbol('NODE_MAILER_TRANSPORT');

export const TransporterFactory: Provider = {
  scope: Scope.TRANSIENT,
  provide: NODE_MAILER_TRANSPORT,
  inject: [EnvService, Logger],
  async useFactory(env: EnvService, logger: Logger) {
    const auth: SMTPConnection.AuthenticationType = {
      user: env.get('GOOGLE_GMAIL_USER'),
      pass: env.get('GOOGLE_GMAIL_PASSWORD'),
    };

    try {
      logger.log(
        'TransporterFactory',
        `Creating nodemailer transporter with options: ${JSON.stringify(auth, null, 2)}`,
      );

      const transporter = createTransport({
        service: 'gmail',
        secure: true,
        host: 'smtp.gmail.com',
        port: 465,
        auth,
      } as SMTPTransport.Options);

      logger.log('TransporterFactory', 'Transporter created!');

      return transporter;
    } catch (error) {}
  },
};
