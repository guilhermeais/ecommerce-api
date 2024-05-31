import forge from 'node-forge';
import { Env } from '@/infra/env/env';
import {
  MongoDBContainer,
  StartedMongoDBContainer,
} from '@testcontainers/mongodb';

let mongoContainer: StartedMongoDBContainer;

async function startMongoDB() {
  console.log('⌛ Starting MongoDBContainer...');

  mongoContainer = await new MongoDBContainer().start();

  const uri = `${mongoContainer.getConnectionString()}?directConnection=true`;

  console.log(`🚀 MongoDBContainer started at ${uri}`);

  return { uri };
}

async function stopMongoDB() {
  console.log('⌛ Stopping MongoDBContainer...');
  await mongoContainer.stop();
  console.log('💤 MongoDBContainer stopped');
}

export async function setup() {
  const { uri } = await startMongoDB();

  const { publicKey, privateKey } = forge.pki.rsa.generateKeyPair({
    bits: 2048,
    e: 0x10001,
  });

  const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
  const publicKeyPem = forge.pki.publicKeyToPem(publicKey);

  const mockedEnvs: Env = {
    PORT: 3000,
    JWT_PRIVATE_KEY: Buffer.from(privateKeyPem).toString('base64'),
    JWT_PUBLIC_KEY: Buffer.from(publicKeyPem).toString('base64'),
    APP_NAME: 'PiaLabs Ecommerce',
    APP_EMAIL: 'test@mail.com',
    GOOGLE_CLIENT_ID: 'fake-client-id',
    GOOGLE_CLIENT_SECRET: 'fake-secret',
    GOOGLE_REFRESH_TOKEN: 'fake-refresh-token',
    ACCOUNT_CONFIRMATION_URL: 'http://localhost:3000/confirm',
    GOOGLE_REDIRECT_URI: 'https://developers.google.com/oauthplayground',

    CONFIRMATION_TOKEN_EXPIRES_IN: 1000 * 60 * 60 * 24,
    FINISH_SIGNUP_INVITE_URL: 'http://localhost:3000/finish-signup-invite',
    SIGNUP_INVITE_EXPIRES_IN: 1000 * 60 * 60 * 24,

    IS_TESTING: true,
    MONGO_URI: uri,

    GOOGLE_APPLICATION_CREDENTIALS:
      Buffer.from('fake-credentials').toString('base64'),
    GOOGLE_STORAGE_BUCKET: 'fake-bucket',
  };

  Object.entries(mockedEnvs).forEach(([key, value]) => {
    process.env[key] = value as any;
  });
}

export async function teardown() {
  console.log('teardown');
  await stopMongoDB();
}
