import { ConfirmationTokensRepository } from '@/domain/auth/application/gateways/repositories/confirmation-tokens-repository';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { INestApplication } from '@nestjs/common';
import { Model } from 'mongoose';
import { makeConfirmationToken } from 'test/auth/enterprise/entities/make-confirmation-token';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';
import { MongoConfirmationTokenModel } from '../schemas/confirmation-token.model';
import { MongoDbConfirmationTokensRepository } from './mongodb-confirmation-tokens.repository';

describe('MongoDbConfirmationTokensRepository', () => {
  let app: INestApplication;
  let sut: MongoDbConfirmationTokensRepository;
  let userFactory: UserFactory;
  let confirmationTokenModel: Model<MongoConfirmationTokenModel>;

  beforeAll(async () => {
    vi.useFakeTimers({
      now: new Date(),
    });

    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule, CryptographyModule],
      providers: [UserFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    sut = moduleRef.get(ConfirmationTokensRepository);
    userFactory = moduleRef.get(UserFactory);
    confirmationTokenModel = moduleRef.get(
      MongoConfirmationTokenModel.COLLECTION_NAME,
    );

    await app.init();
  });

  afterAll(async () => {
    vi.useRealTimers();
    await app.close();
  });

  describe('save()', () => {
    it('should save a confirmation token', async () => {
      const { user } = await userFactory.makeUser();
      const confirmationToken = makeConfirmationToken({
        userId: user.id,
      });

      await sut.save(confirmationToken);

      const savedConfirmationToken = await confirmationTokenModel.findById(
        confirmationToken.id.toValue(),
      );

      expect(savedConfirmationToken).not.toBeNull();
      expect(savedConfirmationToken?.id).toEqual(
        confirmationToken.id.toValue(),
      );
      expect(savedConfirmationToken?.email).toEqual(
        confirmationToken.email.value,
      );
      expect(savedConfirmationToken?.expiresIn).toEqual(
        confirmationToken.expiresIn,
      );
      expect(savedConfirmationToken?.userId).toEqual(
        confirmationToken.userId.toValue(),
      );
    });
  });

  describe('findById()', () => {
    it('should find a confirmation token by id', async () => {
      const { user } = await userFactory.makeUser();
      const confirmationToken = makeConfirmationToken({
        userId: user.id,
      });

      await sut.save(confirmationToken);

      const foundConfirmationToken = await sut.findById(confirmationToken.id);

      expect(foundConfirmationToken).not.toBeNull();
      expect(foundConfirmationToken?.id).toEqual(confirmationToken.id);
      expect(foundConfirmationToken?.email).toEqual(confirmationToken.email);
      expect(foundConfirmationToken?.expiresIn).toEqual(
        confirmationToken.expiresIn,
      );
      expect(foundConfirmationToken?.userId).toEqual(confirmationToken.userId);
    });

    it('should return null if confirmation token is not found', async () => {
      const { user } = await userFactory.makeUser();
      const confirmationToken = makeConfirmationToken({
        userId: user.id,
      });

      const foundConfirmationToken = await sut.findById(confirmationToken.id);

      expect(foundConfirmationToken).toBeNull();
    });
  });
});
