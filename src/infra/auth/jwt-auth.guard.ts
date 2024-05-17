import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { Logger } from '@/shared/logger';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private readonly logger: Logger,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const routeName = `[${request.method}] ${request.url}`;
    this.logger.log(JwtAuthGuard.name, `Request to ${routeName}`);
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.log(
        JwtAuthGuard.name,
        `Route ${routeName} is public, skipping authentication`,
      );
      return true;
    }

    const canActivate = await super.canActivate(context);

    const { user } = request;

    if (!user) {
      this.logger.log(
        JwtAuthGuard.name,
        `Route ${routeName} is private, but no user was found in the request`,
      );
      return false;
    }

    this.logger.log(
      JwtAuthGuard.name,
      `Route ${routeName} is private, checking authentication of ther user ${user.id} - ${user.name}`,
    );

    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (roles?.length && !roles.includes(user.role)) {
      this.logger.log(
        JwtAuthGuard.name,
        `Route ${routeName} is private, but the user ${user.id} - ${user.name} does not have the required role`,
      );
      return false;
    }

    this.logger.log(
      JwtAuthGuard.name,
      `Route ${routeName} is private, and the user ${user.id} - ${user.name} has the required role`,
    );

    return canActivate as boolean;
  }
}
