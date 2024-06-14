import { BaseError } from '@/core/errors/base-error';
import { HttpStatus } from '@nestjs/common';

export class ModelNotTrainedError extends BaseError {
  constructor() {
    super({
      message: 'Nenhum modelo treinado encontrado...',
      details: 'Deve treinar um modelo antes de fazer a predição.',
      code: HttpStatus.NOT_FOUND,
      isClientError: true,
    });
  }
}
