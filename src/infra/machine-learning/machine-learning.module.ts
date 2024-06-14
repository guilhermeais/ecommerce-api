import { ProductSimilarityModelGateway } from '@/domain/showcase/application/gateways/gateways/product-similarity-model-gateway';
import { Module } from '@nestjs/common';
import { PyProductSimilarityModel } from './py/py-product-similarity-model';

@Module({
  providers: [
    {
      provide: ProductSimilarityModelGateway,
      useClass: PyProductSimilarityModel,
    },
  ],
  exports: [ProductSimilarityModelGateway],
})
export class MachineLearningModule {}
