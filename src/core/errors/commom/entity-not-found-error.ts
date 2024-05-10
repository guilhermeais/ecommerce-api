import { HttpStatus } from '@nestjs/common';
import { BaseError } from '../base-error';

export class EntityNotFoundError extends BaseError {
  constructor(entity: string, id: string) {
    super({
      message: `Recurso não encontrado!`,
      code: HttpStatus.NOT_FOUND,
      details: `A entidade ${entity} com id ${id} não foi encontrada`,
    });
  }
}
