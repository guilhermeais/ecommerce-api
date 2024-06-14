import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export abstract class ProductSimilarityModelGateway {
  abstract predict(productId: UniqueEntityID): Promise<UniqueEntityID[]>;
  abstract train(data: TrainDataGenerator): Promise<void>;
}

export type TrainDataGenerator = AsyncGenerator<TrainData>;

export type TrainData = {
  sellId: UniqueEntityID;
  productId: UniqueEntityID;
  unitPrice: number;
  quantity: number;
};
