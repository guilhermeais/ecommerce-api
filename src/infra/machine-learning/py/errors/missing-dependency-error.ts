import { BaseError } from '@/core/errors/base-error';
import { HttpStatus } from '@nestjs/common';

export class MissingDependencyError extends BaseError {
  constructor(dependency: string, details: string) {
    super({
      message: `Dependencia "${dependency}" necessária para execução não encontrada.`,
      details,
      isClientError: false,
      code: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
}
