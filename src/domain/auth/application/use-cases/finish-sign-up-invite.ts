import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { EventManager, Events } from '@/core/types/events';
import { UseCase } from '@/core/types/use-case';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { Logger } from '@/shared/logger';
import { Address } from '../../enterprise/entities/value-objects/address';
import { CPF } from '../../enterprise/entities/value-objects/cpf';
import { Password } from '../../enterprise/entities/value-objects/password';
import { Encrypter } from '../gateways/cryptography/encrypter';
import { Hasher } from '../gateways/cryptography/hasher';
import { SignUpInvitesRepository } from '../gateways/repositories/sign-up-invites.repository';
import { UsersRepository } from '../gateways/repositories/user-repository';
import { LoginResponse } from './login';
import { Injectable } from '@nestjs/common';

export type FinishSigUpInviteRequest = {
  inviteId: string;
  userData: {
    password: string;
    name: string;
    cpf: string;
    phone?: string;
    address?: {
      cep: string;
      address: string;
      number: string;
      state: string;
      city: string;
    };
  };
};

export type FinishSignUpInviteResponse = LoginResponse;

@Injectable()
export class FinishSignUpInviteUseCase
  implements UseCase<FinishSigUpInviteRequest, FinishSignUpInviteResponse>
{
  constructor(
    private readonly signUpInvitesRepository: SignUpInvitesRepository,
    private readonly userRepository: UsersRepository,
    private readonly hasher: Hasher,
    private readonly encrypter: Encrypter,
    private readonly eventManager: EventManager,
    private readonly logger: Logger,
  ) {}

  async execute(request: FinishSigUpInviteRequest): Promise<LoginResponse> {
    const { userData } = request;
    const inviteId = new UniqueEntityID(request.inviteId);

    try {
      this.logger.log(
        FinishSignUpInviteUseCase.name,
        `Finishing sign up invite ${inviteId.toString()} with data: ${JSON.stringify(
          userData,
          undefined,
          2,
        )}`,
      );

      const invite = await this.signUpInvitesRepository.findById(inviteId);

      if (!invite) {
        throw new EntityNotFoundError(
          'Convite de Cadastro',
          inviteId.toString(),
        );
      }

      const password = Password.create(userData.password);
      const hashedPassword = await this.hasher.hash(password.value);

      const cpf = CPF.create(userData.cpf);
      const address = userData.address && Address.create(userData.address);

      const user = invite.finishSignUp({
        ...userData,
        cpf,
        password: hashedPassword,
        address,
      });

      await this.userRepository.save(user);
      await this.signUpInvitesRepository.save(invite);

      this.logger.log(
        FinishSignUpInviteUseCase.name,
        `Sign up invite ${inviteId.toString()} finished successfully, user ${user.id.toString()} - ${user.email.value} created!`,
      );

      await this.eventManager.publish(Events.USER_CREATED, user);

      const authToken = await this.encrypter.encrypt<UserPayload>({
        sub: user.id.toString(),
      });

      return {
        user,
        authToken,
      };
    } catch (error: any) {
      this.logger.error(
        FinishSignUpInviteUseCase.name,
        `Error finishing sign up invite ${inviteId.toString()}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
