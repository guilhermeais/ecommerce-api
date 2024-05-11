import { INestApplication } from '@nestjs/common';
import { JwtEncrypter } from './jwt-encrypter';
import { makeTestingApp } from 'test/make-app';
import { Encrypter } from '@/domain/auth/application/gateways/cryptography/encrypter';

describe('JwtEncrypter', () => {
  let sut: JwtEncrypter;
  let app: INestApplication;

  beforeAll(async () => {
    app = (await makeTestingApp().compile()).createNestApplication();

    sut = app.get(Encrypter);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('encrypt()', () => {
    it('should encrypt a payload into a token', async () => {
      const payload = { id: 'any_id' };

      const token = await sut.encrypt(payload);

      expect(token).toBeDefined();
      expect(token).toBeTypeOf('string');

      const decoded = await sut.decode(token);

      expect(decoded).toMatchObject(payload);
    });
  });
});
