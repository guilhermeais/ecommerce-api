import { BaseError } from '@/core/errors/base-error';
import { HttpStatus } from '@nestjs/common';

export class PythonScriptError extends BaseError {
  constructor(code: number, error: string) {
    super({
      message: `Erro ao executar script python (${code}): ${error}`,
      isClientError: false,
      code: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
}
