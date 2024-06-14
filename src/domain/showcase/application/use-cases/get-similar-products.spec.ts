import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { InMemoryShowcaseProductRepository } from '@/infra/database/in-memory/repositories/showcase/in-memory-showcase-products-repository';
import { Logger } from '@/shared/logger';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { FakeProductSimilarityModel } from 'test/showcase/application/gateways/gateways/fake-product-similarity-model';
import { makeShowcaseProduct } from 'test/showcase/enterprise/entities/make-showcase-product';
import { GetSimilarProductsUseCase } from './get-similar-products';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';

describe('GetSimilarProducts UseCase', () => {
  let sut: GetSimilarProductsUseCase;
  let productSimilarityModel: FakeProductSimilarityModel;
  let showcaseProductsRepository: InMemoryShowcaseProductRepository;
  let logger: Logger;

  beforeEach(() => {
    productSimilarityModel = new FakeProductSimilarityModel();

    showcaseProductsRepository = new InMemoryShowcaseProductRepository();

    logger = makeFakeLogger();

    sut = new GetSimilarProductsUseCase(
      productSimilarityModel,
      showcaseProductsRepository,
      logger,
    );
  });

  it('should return empty array if any similar product is found', async () => {
    const product = makeShowcaseProduct();

    showcaseProductsRepository.products.push(product);

    const response = await sut.execute({ productId: product.id.toString() });

    expect(response.products).toEqual([]);
  });

  it('should return the similar products', async () => {
    const product = makeShowcaseProduct();
    const similarProducts = [makeShowcaseProduct(), makeShowcaseProduct()];
    showcaseProductsRepository.products.push(product, ...similarProducts);
    const similarProductIds = similarProducts.map((p) => p.id);

    productSimilarityModel.fakeProductIds.set(
      product.id.toString(),
      similarProductIds,
    );

    const response = await sut.execute({ productId: product.id.toString() });

    expect(response.products).toEqual(similarProducts);
  });

  it('should throw EntityNotFoundError if the product does not exists', async () => {
    const id = new UniqueEntityID().toString();
    await expect(sut.execute({ productId: id })).rejects.toThrowError(
      new EntityNotFoundError('Produto', id),
    );
  });
});
