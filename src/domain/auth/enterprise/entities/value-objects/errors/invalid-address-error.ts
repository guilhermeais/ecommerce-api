import { BaseError } from '@/core/errors/base-error';
import { HttpStatus } from '@nestjs/common';

export type InvalidAddressErrorArgs = {
  missingProperties: string[];
};
export class InvalidAddressError extends BaseError {
  public readonly missingProperties: string[];
  constructor(params: InvalidAddressErrorArgs) {
    super({
      message: `Endereço inválido.`,
      code: HttpStatus.BAD_REQUEST,
      details: `Endereço inválido. Faltando propriedades: ${params.missingProperties.join(', ')}`,
    });
    this.missingProperties = params.missingProperties;
  }
}
