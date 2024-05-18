import { BaseError } from '@/core/errors/base-error';
import { SignUpInvite } from '@/domain/auth/enterprise/entities/signup-invite';
import { HttpStatus } from '@nestjs/common';

export class SignUpInviteExpiredError extends BaseError {
  constructor(expiredSignUpInvite: SignUpInvite) {
    super({
      message: `O convite de cadastro ${expiredSignUpInvite.id.toString()} expirou ou já foi utilizado!`,
      details: `O convite de cadastro ${expiredSignUpInvite.id.toString()} para ${expiredSignUpInvite.guestEmail.value} expirou!`,
      code: HttpStatus.GONE,
    });
  }
}
