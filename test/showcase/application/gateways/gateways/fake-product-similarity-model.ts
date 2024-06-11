import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { ProductSimilarityModelGateway } from '@/domain/showcase/application/gateways/gateways/product-similarity-model-gateway';

export class FakeProductSimilarityModel
  implements ProductSimilarityModelGateway
{
  readonly fakeProductIds = new Map<string, UniqueEntityID[]>();

  async predict(productId: UniqueEntityID): Promise<UniqueEntityID[]> {
    const similarProductIds = this.fakeProductIds.get(productId.toString());
    return similarProductIds?.length ? similarProductIds : [];
  }
}
