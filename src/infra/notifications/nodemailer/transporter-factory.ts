import { EnvService } from '@/infra/env/env.service';
import { Logger } from '@/shared/logger';
import { Provider, Scope } from '@nestjs/common';
import { google } from 'googleapis';
import { createTransport } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
const { OAuth2 } = google.auth;
export const NODE_MAILER_TRANSPORT = Symbol('NODE_MAILER_TRANSPORT');

export const TransporterFactory: Provider = {
  scope: Scope.TRANSIENT,
  provide: NODE_MAILER_TRANSPORT,
  inject: [EnvService, Logger],
  async useFactory(env: EnvService, logger: Logger) {
    const oauth2Options = {
      clientId: env.get('GOOGLE_CLIENT_ID'),
      clientSecret: env.get('GOOGLE_CLIENT_SECRET'),
      redirectUri: env.get('GOOGLE_REDIRECT_URI'),
      credentials: {
        refresh_token: env.get('GOOGLE_REFRESH_TOKEN'),
      },
    };
    logger.log(
      TransporterFactory.toString(),
      `Creating nodemailer transporter with options: ${JSON.stringify(oauth2Options, null, 2)}`,
    );
    const oauth2Client = new OAuth2(oauth2Options);

    const accessToken = await oauth2Client.getAccessToken();

    logger.debug(
      TransporterFactory.toString(),
      `Access token: ${JSON.stringify(accessToken, null, 2)}`,
    );

    const transporter = createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: env.get('APP_EMAIL'),
        accessToken: accessToken.token,
        clientId: env.get('GOOGLE_CLIENT_ID'),
        clientSecret: env.get('GOOGLE_CLIENT_SECRET'),
        refreshToken: env.get('GOOGLE_REFRESH_TOKEN'),
      },
    } as SMTPTransport.Options);

    logger.log(TransporterFactory.toString(), 'Transporter created!');

    return transporter;
  },
};
