import { HttpStatus } from '@nestjs/common';
import { BaseError } from '../base-error';

export class NotAllowedError extends BaseError {
  constructor(notAlloewdOperation: string) {
    super({
      message: 'Operação não permitida',
      code: HttpStatus.FORBIDDEN,
      details: `A operação ${notAlloewdOperation} não é permitida`,
    });
  }
}
