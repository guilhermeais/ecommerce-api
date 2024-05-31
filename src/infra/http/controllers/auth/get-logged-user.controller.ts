import { User } from '@/domain/auth/enterprise/entities/user';
import { CurrentUser } from '@/infra/auth/current-user.decorator';
import { Logger } from '@/shared/logger';
import { Controller, Get } from '@nestjs/common';
import { UserHTTPResponse, UserPresenter } from './presenters/user-presenter';

export type GetLoggedUserResponse = UserHTTPResponse;

@Controller('/user')
export class GetLoggedUserController {
  constructor(private readonly logger: Logger) {}

  @Get()
  async handle(@CurrentUser() user: User): Promise<GetLoggedUserResponse> {
    try {
      return UserPresenter.toHTTP(user);
    } catch (error: any) {
      this.logger.error(
        GetLoggedUserController.name,
        `Error: ${JSON.stringify(error)}`,
        error.stack,
      );

      throw error;
    }
  }
}
