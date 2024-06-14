import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import {
  ProductSimilarityModelGateway,
  TrainData,
  TrainDataGenerator,
} from '@/domain/showcase/application/gateways/gateways/product-similarity-model-gateway';

export class FakeProductSimilarityModel
  implements ProductSimilarityModelGateway
{
  readonly fakeProductIds = new Map<string, UniqueEntityID[]>();
  readonly trainedData: TrainData[] = [];

  async predict(productId: UniqueEntityID): Promise<UniqueEntityID[]> {
    const similarProductIds = this.fakeProductIds.get(productId.toString());
    return similarProductIds?.length ? similarProductIds : [];
  }

  async train(data: TrainDataGenerator): Promise<void> {
    for await (const trainData of data) {
      this.trainedData.push(trainData);
    }
  }

  clear(): void {
    this.fakeProductIds.clear();
    this.trainedData.length = 0;
  }
}
