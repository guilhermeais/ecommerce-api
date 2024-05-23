import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { SignUpInvitesRepository } from '@/domain/auth/application/gateways/repositories/sign-up-invites.repository';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { INestApplication } from '@nestjs/common';
import { Model } from 'mongoose';
import {
  SignUpInviteFactory,
  makeFinishUserSignUpData,
  makeSignUpInvite,
} from 'test/auth/enterprise/entities/make-sign-up-invite';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';
import { MongoSignUpInviteModel } from '../schemas/sign-up-invite.model';
import { MongoDbSignUpInvitesRepository } from './mongodb-signup-invites.repository';
import { SignUpInviteStatus } from '@/domain/auth/enterprise/entities/enums/signup-invite-status';

describe('MongoDbSignUpInvitesRepository', () => {
  let app: INestApplication;
  let sut: MongoDbSignUpInvitesRepository;
  let signUpInviteFactory: SignUpInviteFactory;
  let signUpInvitesModel: Model<MongoSignUpInviteModel>;

  beforeAll(async () => {
    vi.useFakeTimers({
      now: new Date(),
    });

    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule, CryptographyModule],
      providers: [UserFactory, SignUpInviteFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    sut = moduleRef.get(SignUpInvitesRepository);
    signUpInviteFactory = moduleRef.get(SignUpInviteFactory);
    signUpInvitesModel = moduleRef.get(MongoSignUpInviteModel.COLLECTION_NAME);

    await app.init();
  });

  afterAll(async () => {
    vi.useRealTimers();
    await app.close();
  });

  describe('list()', () => {
    it('should return empty items whe has no signup invites', async () => {
      const response = await sut.list({ page: 1, limit: 10 });

      expect(response.items).toHaveLength(0);
      expect(response.total).toBe(0);
      expect(response.currentPage).toBe(1);
      expect(response.pages).toBe(0);
    });

    it('should paginate existing signup invites', async () => {
      await Promise.all(
        Array.from({ length: 10 }).map(async () => {
          return await signUpInviteFactory.makeSignUpInvite();
        }),
      );

      const response = await sut.list({ page: 1, limit: 5 });

      expect(response.items).toHaveLength(5);

      expect(response.total).toBe(10);
      expect(response.currentPage).toBe(1);
      expect(response.pages).toBe(2);

      const secondResponse = await sut.list({ page: 2, limit: 5 });

      expect(secondResponse.items).toHaveLength(5);
      expect(secondResponse.total).toBe(10);
      expect(secondResponse.currentPage).toBe(2);
      expect(secondResponse.pages).toBe(2);

      const thirdResponse = await sut.list({ page: 3, limit: 5 });

      expect(thirdResponse.items).toHaveLength(0);
    });
  });

  describe('findById()', () => {
    it('should return null when signup invite not found', async () => {
      const signUpInvite = await sut.findById(new UniqueEntityID());

      expect(signUpInvite).toBeNull();
    });

    it('should return signup invite when found', async () => {
      const signUpInvite = await signUpInviteFactory.makeSignUpInvite();

      const foundSignUpInvite = await sut.findById(signUpInvite.id);

      expect(foundSignUpInvite).not.toBeNull();
      expect(foundSignUpInvite?.id.toValue()).toBe(signUpInvite.id.toValue());
      expect(foundSignUpInvite?.guestEmail.value).toBe(
        signUpInvite.guestEmail.value,
      );
      expect(foundSignUpInvite?.guestName).toBe(signUpInvite.guestName);
      expect(foundSignUpInvite?.sentBy.id.toValue()).toBe(
        signUpInvite.sentBy.id.toValue(),
      );
    });
  });

  describe('save()', () => {
    it('should create a signup invite', async () => {
      const signUpInvite = makeSignUpInvite();

      await sut.save(signUpInvite);

      const foundSignUpInvite = await signUpInvitesModel.findOne({
        id: signUpInvite.id.toValue(),
      });

      expect(foundSignUpInvite).not.toBeNull();
      expect(foundSignUpInvite?.id).toBe(signUpInvite.id.toValue());
      expect(foundSignUpInvite?.guestEmail).toBe(signUpInvite.guestEmail.value);
      expect(foundSignUpInvite?.guestName).toBe(signUpInvite.guestName);
      expect(foundSignUpInvite?.sentById).toBe(
        signUpInvite.sentBy.id.toValue(),
      );
    });

    it('should update an existing signup invite', async () => {
      const signUpInvite = await signUpInviteFactory.makeSignUpInvite();

      expect(signUpInvite.status).toBe(SignUpInviteStatus.PENDING);

      signUpInvite.finishSignUp(makeFinishUserSignUpData());

      await sut.save(signUpInvite);

      const foundSignUpInvite = await signUpInvitesModel.findOne({
        id: signUpInvite.id.toValue(),
      });

      expect(foundSignUpInvite).not.toBeNull();
      expect(foundSignUpInvite?.id).toBe(signUpInvite.id.toValue());
      expect(foundSignUpInvite?.status).toBe(SignUpInviteStatus.FINISHED);
    });
  });
});
