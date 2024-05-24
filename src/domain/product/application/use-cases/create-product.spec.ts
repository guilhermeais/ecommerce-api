import { Logger } from '@/shared/logger';
import { ProductsRepository } from '../gateways/repositories/products-repository';
import { StorageGateway } from '../gateways/storage/storage-gateway';
import { CreateProductUseCase } from './create-product';
import { makeFakeLogger } from 'test/shared/logger.mock';

describe('CreateProduct use case', () => {
  let sut: CreateProductUseCase;
  let storageGateway: StorageGateway;
  let productsRepository: ProductsRepository;
  let logger: Logger;

  beforeEach(() => {
    logger = makeFakeLogger();
  });
});
