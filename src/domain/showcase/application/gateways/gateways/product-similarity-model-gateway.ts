import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export abstract class ProductSimilarityModelGateway {
  abstract predict(productId: UniqueEntityID): Promise<UniqueEntityID[]>;
}
