import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import {
  ProductSimilarityModelGateway,
  TrainData,
  TrainDataGenerator,
} from '@/domain/showcase/application/gateways/gateways/product-similarity-model-gateway';
import { Logger } from '@/shared/logger';
import { Injectable } from '@nestjs/common';
import { exec, spawn } from 'child_process';
import { createWriteStream } from 'fs';
import { mkdir, readdir, rm } from 'fs/promises';
import path from 'path';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { MissingDependencyError } from './errors/missing-dependency-error';
import { ModelNotTrainedError } from './errors/model-not-trained-error';
import { PythonScriptError } from './errors/python-script-error';

@Injectable()
export class PyProductSimilarityModel implements ProductSimilarityModelGateway {
  constructor(private readonly logger: Logger) {}

  static readonly MODEL_DIR = path.resolve(__dirname, './models');
  static readonly MODEL_FILE = 'model.pkl';
  static readonly MATRIX_FILE = 'matrix.pkl';
  static readonly TRAIN_DATA_FILE = 'train-data.csv';
  static readonly TRAIN_PYTHON_SCRIPT = path.resolve(
    __dirname,
    './train-script/index.py',
  );

  static readonly PREDICT_PYTHON_SCRIPT = path.resolve(
    __dirname,
    './predict-script/index.py',
  );

  async predict(productId: UniqueEntityID): Promise<UniqueEntityID[]> {
    try {
      this.logger.log(
        PyProductSimilarityModel.name,
        `Predicting similar products for ${productId.toString()}`,
      );

      const hasPython = await this.hasPythonInstalled();

      if (!hasPython) {
        throw new MissingDependencyError(
          'Python',
          'Python não está instalado na máquina.',
        );
      }

      const { modelPath, matrixPath } = await this.getLastModelPath();

      if (!modelPath || !matrixPath) {
        throw new ModelNotTrainedError();
      }

      this.logger.log(
        PyProductSimilarityModel.name,
        `Model path: ${modelPath} and matrix path: ${matrixPath}`,
      );

      const similarProducts = await this.runPredictPythonScript(
        productId.toString(),
        modelPath,
        matrixPath,
      );

      this.logger.log(
        PyProductSimilarityModel.name,
        `Similar products found: ${similarProducts}`,
      );

      return similarProducts.map((id: string) => new UniqueEntityID(id));
    } catch (error: any) {
      this.logger.error(
        PyProductSimilarityModel.name,
        `Error predicting similar products of ${productId.toString()}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  private async hasPythonInstalled(): Promise<boolean> {
    this.logger.log(PyProductSimilarityModel.name, 'Checking python version');
    return new Promise((resolve) => {
      exec('python3 --version', (error, stdout, stderr) => {
        if (error) {
          this.logger.error(
            PyProductSimilarityModel.name,
            `Error checking python version: ${error.message}`,
            error.stack,
          );
          resolve(false);
        }

        if (stderr) {
          this.logger.error(
            PyProductSimilarityModel.name,
            `Error checking python version: ${stderr}`,
          );
          resolve(false);
        }

        this.logger.log(
          PyProductSimilarityModel.name,
          `Python version: ${stdout}`,
        );
        resolve(true);
      });
    });
  }

  private async getLastModelPath(): Promise<{
    modelPath: string | null;
    matrixPath: string | null;
    lastModelDir: string | null;
  }> {
    this.logger.log(PyProductSimilarityModel.name, 'Getting last model path');
    const modelsDir = await readdir(PyProductSimilarityModel.MODEL_DIR).catch(
      (err) => {
        this.logger.error(
          PyProductSimilarityModel.name,
          `Error reading models directory: ${err.message}`,
          err.stack,
        );

        if (err.code === 'ENOENT') {
          return [];
        }

        throw err;
      },
    );

    this.logger.log(
      PyProductSimilarityModel.name,
      `Found ${modelsDir.length} models`,
    );

    if (!modelsDir.length) {
      return { modelPath: null, matrixPath: null, lastModelDir: null };
    }

    const lastModelDir = modelsDir.reduce((prev, current) =>
      prev > current ? prev : current,
    );
    const modelPath = path.resolve(
      PyProductSimilarityModel.MODEL_DIR,
      lastModelDir,
      PyProductSimilarityModel.MODEL_FILE,
    );
    const matrixPath = path.resolve(
      PyProductSimilarityModel.MODEL_DIR,
      lastModelDir,
      PyProductSimilarityModel.MATRIX_FILE,
    );
    const lastModelDirComplete = path.resolve(
      PyProductSimilarityModel.MODEL_DIR,
      lastModelDir,
    );

    this.logger.log(
      PyProductSimilarityModel.name,
      `Last model path: ${modelPath} and matrix path: ${matrixPath}`,
    );

    return { modelPath, matrixPath, lastModelDir: lastModelDirComplete };
  }

  private async runPredictPythonScript(
    productId: string,
    modelPath: string,
    matrixPath: string,
  ): Promise<string[]> {
    this.logger.log(
      PyProductSimilarityModel.name,
      `Running python script ${PyProductSimilarityModel.PREDICT_PYTHON_SCRIPT} with productId: ${productId}, modelPath: ${modelPath} and matrixPath: ${matrixPath}`,
    );

    const result = JSON.parse(
      await this.runPythonScript(
        PyProductSimilarityModel.PREDICT_PYTHON_SCRIPT,
        productId,
        modelPath,
        matrixPath,
      ),
    ) as string[];

    return result;
  }

  private runPythonScript(
    scriptPath: string,
    ...args: string[]
  ): Promise<string> {
    this.logger.log(
      PyProductSimilarityModel.name,
      `Running python script ${scriptPath} with args: ${args}`,
    );
    return new Promise((resolve, reject) => {
      const python = spawn('python3', [scriptPath, ...args]);

      let result = '';
      let error = '';
      python.stdout.on('data', (data) => {
        this.logger.log(
          PyProductSimilarityModel.name,
          `Python script stdout: ${data.toString()}`,
        );
        result += data.toString();
      });

      python.stderr.on('data', (data) => {
        this.logger.error(
          PyProductSimilarityModel.name,
          `Python script stderr: ${data.toString()}`,
        );
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0 || error) {
          reject(new PythonScriptError(1, error));
        } else {
          this.logger.log(
            PyProductSimilarityModel.name,
            `Python script result: ${result}`,
          );
          resolve(result);
        }
      });
    });
  }

  async train(data: TrainDataGenerator): Promise<void> {
    try {
      this.logger.log(
        PyProductSimilarityModel.name,
        'Training model with new data...',
      );

      const hasPython = await this.hasPythonInstalled();

      if (!hasPython) {
        throw new MissingDependencyError(
          'Python',
          'Python não está instalado na máquina.',
        );
      }

      const { lastModelDir } = await this.getLastModelPath();

      const newModelDir = await this.createNewModelDir();

      const { csvPath } = await this.pipeToCSV(
        Readable.from(data),
        newModelDir,
      );

      this.logger.log(
        PyProductSimilarityModel.name,
        'Data piped to CSV. Training model...',
      );

      await this.runTrainPythonScript(newModelDir, csvPath);

      this.logger.log(PyProductSimilarityModel.name, 'Model trained');

      if (lastModelDir) {
        this.logger.log(
          PyProductSimilarityModel.name,
          `Deleting old model directory ${lastModelDir}`,
        );
        await this.deleteTemplateDir(lastModelDir);
      }
    } catch (error: any) {
      this.logger.error(
        PyProductSimilarityModel.name,
        `Error training model: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  private async createNewModelDir(): Promise<string> {
    this.logger.log(
      PyProductSimilarityModel.name,
      'Creating new model directory...',
    );
    const newModelDirName = `model-${Date.now()}`;
    const newModelPath = path.resolve(
      PyProductSimilarityModel.MODEL_DIR,
      newModelDirName,
    );

    this.logger.log(
      PyProductSimilarityModel.name,
      `New model directory: ${newModelPath}: `,
    );

    await mkdir(newModelPath, {
      recursive: true,
    });

    return newModelPath;
  }

  private async pipeToCSV(data: Readable, newModelDir: string) {
    const csvPath = path.resolve(
      PyProductSimilarityModel.MODEL_DIR,
      newModelDir,
      PyProductSimilarityModel.TRAIN_DATA_FILE,
    );
    this.logger.log(
      PyProductSimilarityModel.name,
      `Piping data to CSV file to ${csvPath}...`,
    );
    const csvStream = createWriteStream(csvPath)
      .on('error', (error) => {
        this.logger.error(
          PyProductSimilarityModel.name,
          `Error writing CSV file: ${error.message}`,
          error.stack,
        );
      })
      .on('finish', () => {
        this.logger.log(
          PyProductSimilarityModel.name,
          `Data piped to CSV file ${csvPath}`,
        );
      });

    csvStream.write('quantidade_produto,preco_unitario,id_venda,id_produto\n');
    await pipeline(
      data,
      new Transform({
        objectMode: true,
        transform(chunk, _encoding, callback) {
          const trainData = chunk as TrainData;
          const csvLine = `${trainData.quantity},${trainData.unitPrice},${trainData.sellId.toString()},${trainData.productId.toString()}\n`;
          callback(null, csvLine);
        },
      }),
      csvStream,
    );

    return { csvPath };
  }

  private async runTrainPythonScript(
    modelDir: string,
    csvPath: string,
  ): Promise<void> {
    this.logger.log(
      PyProductSimilarityModel.name,
      `Running python script ${PyProductSimilarityModel.TRAIN_PYTHON_SCRIPT} with modelDir: ${modelDir} and csvPath: ${csvPath}`,
    );

    await this.runPythonScript(
      PyProductSimilarityModel.TRAIN_PYTHON_SCRIPT,
      csvPath,
      modelDir,
    );
  }

  private async deleteTemplateDir(modelDir: string): Promise<void> {
    try {
      this.logger.log(
        PyProductSimilarityModel.name,
        `Deleting model directory ${modelDir}`,
      );
      await rm(modelDir, {
        recursive: true,
      });

      this.logger.log(
        PyProductSimilarityModel.name,
        `Model directory ${modelDir} deleted`,
      );
    } catch (error: any) {
      this.logger.error(
        PyProductSimilarityModel.name,
        `Error deleting model directory ${modelDir}: ${error.message}`,
        error.stack,
      );
    }
  }
}
