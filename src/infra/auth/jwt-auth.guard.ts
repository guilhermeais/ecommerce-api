import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<string[]>('ROLES', [
      context.getHandler(),
      context.getClass(),
    ]);

    console.log(roles);

    return super.canActivate(context);
  }
}
