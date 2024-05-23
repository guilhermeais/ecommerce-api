import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';
import { SignUpInvitesRepository } from '@/domain/auth/application/gateways/repositories/sign-up-invites.repository';
import { SignUpInvite } from '@/domain/auth/enterprise/entities/signup-invite';
import { EnvService } from '@/infra/env/env.service';
import { Logger } from '@/shared/logger';
import { Model } from 'mongoose';
import { MongoDbSignUpInvitesMapper } from '../mappers/mongodb-signup-invites.mapper';
import { MongoSignUpInviteModel } from '../schemas/sign-up-invite.model';
import { MongoUserModel } from '../schemas/user.model';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class MongoDbSignUpInvitesRepository implements SignUpInvitesRepository {
  constructor(
    @Inject(MongoSignUpInviteModel.COLLECTION_NAME)
    private readonly signUpInviteModel: Model<MongoSignUpInviteModel>,
    private readonly logger: Logger,
    private readonly env: EnvService,
  ) {}

  async list(
    request: PaginatedRequest,
  ): Promise<PaginatedResponse<SignUpInvite>> {
    try {
      this.logger.log(
        MongoDbSignUpInvitesRepository.name,
        `Listing SignUpInvites with request: ${JSON.stringify(request)}`,
      );

      const { page, limit } = request;

      const [result] = (await this.signUpInviteModel.aggregate([
        {
          $lookup: {
            from: MongoUserModel.COLLECTION_NAME,
            localField: 'sentById',
            foreignField: 'id',
            as: 'sentBy',
          },
        },
        {
          $unwind: {
            path: '$sentBy',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            id: 1,
            guestEmail: 1,
            guestName: 1,
            sentBy: 1,
            sentById: 1,
            expiresIn: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
        { $sort: { createdAt: 1 } },
        {
          $facet: {
            metadata: [{ $count: 'total' }],
            items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          },
        },
      ])) as {
        metadata: { total: number }[];
        items: MongoSignUpInviteModel[];
      }[];

      const [metadata] = result?.metadata;

      const total = metadata?.total ?? 0;
      const pages = Math.ceil(total / limit);

      return {
        items: result.items.map(MongoDbSignUpInvitesMapper.toDomain),
        currentPage: page,
        limit,
        pages,
        total,
      };
    } catch (error: any) {
      this.logger.error(
        MongoDbSignUpInvitesRepository.name,
        `Error listing SignUpInvites with ${JSON.stringify(request, null, 2)}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  async findById(id: UniqueEntityID): Promise<SignUpInvite | null> {
    try {
      this.logger.log(
        MongoDbSignUpInvitesRepository.name,
        `Searching SignUpInvite by id: ${id.toString()}`,
      );

      const [signUpInvite] = await this.signUpInviteModel.aggregate([
        {
          $match: {
            id: id.toString(),
          },
        },
        {
          $lookup: {
            from: MongoUserModel.COLLECTION_NAME,
            localField: 'sentById',
            foreignField: 'id',
            as: 'sentBy',
          },
        },
        {
          $unwind: {
            path: '$sentBy',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            id: 1,
            guestEmail: 1,
            guestName: 1,
            sentBy: 1,
            sentById: 1,
            expiresIn: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]);

      if (!signUpInvite) {
        this.logger.log(
          MongoDbSignUpInvitesRepository.name,
          `SignUpInvite not found by id: ${id.toString()}`,
        );
        return null;
      }

      return MongoDbSignUpInvitesMapper.toDomain(signUpInvite);
    } catch (error: any) {
      this.logger.error(
        MongoDbSignUpInvitesRepository.name,
        `Error finding SignUpInvite by id: ${id.toString()}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  async save(signUpInvite: SignUpInvite): Promise<void> {
    try {
      this.logger.log(
        MongoDbSignUpInvitesRepository.name,
        `Saving SignUpInvite: ${JSON.stringify(signUpInvite)}`,
      );

      const signUpInviteModel =
        MongoDbSignUpInvitesMapper.toPersistence(signUpInvite);

      const exists = await this.signUpInviteModel.exists({
        _id: signUpInviteModel._id,
      });

      if (exists) {
        await this.signUpInviteModel.updateOne(
          { _id: signUpInviteModel._id },
          signUpInviteModel,
        );
        return;
      }

      await this.signUpInviteModel.create(signUpInviteModel);
    } catch (error: any) {
      this.logger.error(
        MongoDbSignUpInvitesRepository.name,
        `Error saving SignUpInvite ${JSON.stringify(signUpInvite, null, 2)}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  async clear(): Promise<void> {
    const isTesting = this.env.get('IS_TESTING');
    if (isTesting) {
      await this.signUpInviteModel.deleteMany({}).exec();
      return;
    }

    throw new Error('You can only clear the database in testing environment');
  }
}
