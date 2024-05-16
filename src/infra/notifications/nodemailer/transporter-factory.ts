import { EnvService } from '@/infra/env/env.service';
import { Provider, Scope } from '@nestjs/common';
import { google } from 'googleapis';
import { createTransport } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
const { OAuth2 } = google.auth;

export const NODE_MAILER_TRANSPORT = Symbol('NODE_MAILER_TRANSPORT');

export const TransporterFactory: Provider = {
  scope: Scope.TRANSIENT,
  provide: NODE_MAILER_TRANSPORT,
  inject: [EnvService],
  async useFactory(env: EnvService) {
    const oauth2Client = new OAuth2({
      clientId: env.get('GOOGLE_CLIENT_ID'),
      clientSecret: env.get('GOOGLE_CLIENT_SECRET'),
      redirectUri: env.get('GOOGLE_REDIRECT_URI'),
      credentials: {
        refresh_token: env.get('GOOGLE_REFRESH_TOKEN'),
      },
    });

    const accessToken = await oauth2Client.getAccessToken();

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

    return transporter;
  },
};
