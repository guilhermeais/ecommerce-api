import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { ProductSimilarityModelGateway } from '@/domain/showcase/application/gateways/gateways/product-similarity-model-gateway';
import { Logger } from '@/shared/logger';
import { exec, spawn } from 'child_process';
import { readdir } from 'fs/promises';
import path from 'path';
import { MissingDependencyError } from './errors/missing-dependency-error';
import { ModelNotTrainedError } from './errors/model-not-trained-error';
import { PytonScriptError } from './errors/python-script-error';

export class PyProductSimilarityModel implements ProductSimilarityModelGateway {
  constructor(private readonly logger: Logger) {}
  static readonly MODEL_DIR = path.resolve(__dirname, '../models');
  static readonly PYTHON_SCRIPT = path.resolve(
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

      const similarProducts = await this.runPythonScript(
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
      exec('python --version', (error, stdout, stderr) => {
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
  }> {
    this.logger.log(PyProductSimilarityModel.name, 'Getting last model path');
    const modelDirs = await readdir(PyProductSimilarityModel.MODEL_DIR);

    this.logger.log(
      PyProductSimilarityModel.name,
      `Found ${modelDirs.length} models`,
    );

    if (!modelDirs.length) {
      return { modelPath: null, matrixPath: null };
    }

    const lastModelDir = modelDirs.reduce((prev, current) =>
      prev > current ? prev : current,
    );
    const modelPath = path.resolve(
      PyProductSimilarityModel.MODEL_DIR,
      lastModelDir,
      'model.pkl',
    );
    const matrixPath = path.resolve(
      PyProductSimilarityModel.MODEL_DIR,
      lastModelDir,
      'matriz.pkl',
    );

    this.logger.log(
      PyProductSimilarityModel.name,
      `Last model path: ${modelPath} and matrix path: ${matrixPath}`,
    );

    return { modelPath, matrixPath };
  }

  private runPythonScript(
    productId: string,
    modelPath: string,
    matrixPath: string,
  ): Promise<string[]> {
    this.logger.log(
      PyProductSimilarityModel.name,
      `Running python script ${PyProductSimilarityModel.PYTHON_SCRIPT} with productId: ${productId}, modelPath: ${modelPath} and matrixPath: ${matrixPath}`,
    );
    return new Promise((resolve, reject) => {
      const python = spawn('python', [
        PyProductSimilarityModel.PYTHON_SCRIPT,
        productId.toString(),
        modelPath,
        matrixPath,
      ]);

      let result = '';
      let err = '';
      python.stdout.on('data', (data) => {
        result += data.toString();
      });

      python.stderr.on('data', (data) => {
        err += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0 || err) {
          reject(new PytonScriptError(1, err));
        } else {
          const productIds = JSON.parse(result);
          this.logger.log(
            PyProductSimilarityModel.name,
            `Similar products from python script: ${productIds}`,
          );
          resolve(productIds);
        }
      });
    });
  }
}
