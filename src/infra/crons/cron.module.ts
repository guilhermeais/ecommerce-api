import { TrainProductsSimilarityModelUseCase } from '@/domain/showcase/application/use-cases/train-products-similarity-model';
import { Logger } from '@/shared/logger';
import { Module } from '@nestjs/common';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { DatabaseModule } from '../database/database.module';
import { EnvModule } from '../env/env.module';
import { EnvService } from '../env/env.service';
import { MachineLearningModule } from '../machine-learning/machine-learning.module';
export const TrainProductsSimilarityModelCronName =
  'TrainProductsSimilarityModelCron';
@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    EnvModule,
    MachineLearningModule,
  ],
  providers: [
    TrainProductsSimilarityModelUseCase,
    {
      provide: TrainProductsSimilarityModelCronName,
      inject: [
        SchedulerRegistry,
        TrainProductsSimilarityModelUseCase,
        Logger,
        EnvService,
      ],
      useFactory: (
        schedulerRegistry: SchedulerRegistry,
        useCase: TrainProductsSimilarityModelUseCase,
        logger: Logger,
        env: EnvService,
      ) => {
        const cronTime = env.get('TRAIN_MODEL_CRON');
        logger.log(
          TrainProductsSimilarityModelCronName,
          `cron to train model: ${cronTime}`,
        );
        const job = new CronJob(cronTime, async () => {
          try {
            logger.log(TrainProductsSimilarityModelCronName, 'training model');
            await useCase.execute();
          } catch (error: any) {
            logger.error(
              TrainProductsSimilarityModelCronName,
              'error training model',
              error.stack,
            );
          }
        });
        schedulerRegistry.addCronJob(TrainProductsSimilarityModelCronName, job);
        job.start();

        useCase.execute().catch((error) => {
          logger.error(
            TrainProductsSimilarityModelCronName,
            'error training model for the first time',
            error.stack,
          );
        });

        return job;
      },
    },
  ],
})
export class CronModule {}
