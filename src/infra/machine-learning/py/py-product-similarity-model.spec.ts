import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { TrainData } from '@/domain/showcase/application/gateways/gateways/product-similarity-model-gateway';
import { Logger } from '@/shared/logger';
import { faker } from '@faker-js/faker';
import { fs, vol } from 'memfs';
import path from 'path';
import { Readable } from 'stream';
import { FakeChildProcess } from 'test/fake-child-process';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { Mock } from 'vitest';
import { MissingDependencyError } from './errors/missing-dependency-error';
import { ModelNotTrainedError } from './errors/model-not-trained-error';
import { PythonScriptError } from './errors/python-script-error';
import { PyProductSimilarityModel } from './py-product-similarity-model';

vi.mock('child_process', async () => {
  const actual =
    await vi.importActual<typeof import('child_process')>('child_process');

  return {
    ...actual,
    exec: vi.fn(),
    spawn: vi.fn(),
  };
});

vi.mock('fs/promises', () => fs.promises);
vi.mock('fs', () => fs);

describe('PyProductSimilarityModel', () => {
  let sut: PyProductSimilarityModel;
  let logger: Logger;
  let childProcess: typeof import('child_process') & {
    exec: Mock;
    spawn: Mock;
  };

  const now = new Date();

  beforeEach(async () => {
    vi.clearAllMocks();

    vi.useFakeTimers({
      now,
    });
    logger = makeFakeLogger();
    sut = new PyProductSimilarityModel(logger);
    childProcess = (await import('child_process')) as any;

    vol.fromNestedJSON({
      [PyProductSimilarityModel.MODEL_DIR]: {
        [`model_${Date.now()}`]: {
          'model.pkl': 'model',
          'matriz.pkl': 'matrix',
        },
      },
    });

    childProcess.spawn.mockReturnValue(new FakeChildProcess());
    childProcess.exec.mockImplementation((command, cb) => {
      cb(null, '', '');
      return new FakeChildProcess();
    });
  });

  afterEach(() => {
    vol.reset();
  });

  describe('predict()', () => {
    it('should throw if python is not installed', async () => {
      childProcess.exec.mockImplementation((command, cb) => {
        cb('Python not found', '', '');
        return new FakeChildProcess();
      });

      await expect(sut.predict(new UniqueEntityID())).rejects.toThrow(
        new MissingDependencyError(
          'Python',
          'Python não está instalado na máquina.',
        ),
      );
    });

    it('should throw if there is no model', async () => {
      vol.reset();
      vol.fromNestedJSON({
        [PyProductSimilarityModel.MODEL_DIR]: {},
      });

      await expect(sut.predict(new UniqueEntityID())).rejects.toThrow(
        new ModelNotTrainedError(),
      );
    });

    it('should get all similar products ids', async () => {
      const similarProductsIds = [
        faker.string.uuid(),
        faker.string.uuid(),
        faker.string.uuid(),
      ];
      const fakeChildProcess = new FakeChildProcess({
        stdout: new Readable({
          read() {
            this.push(JSON.stringify(similarProductsIds));
            this.push(null);
          },
        }),
      });
      childProcess.spawn.mockReturnValue(fakeChildProcess);

      const similarProducts = await sut.predict(new UniqueEntityID());

      expect(similarProducts).toEqual(
        similarProductsIds.map((id) => new UniqueEntityID(id)),
      );
    });

    it('should throw if there is no model file', async () => {
      vol.reset();

      await expect(sut.predict(new UniqueEntityID())).rejects.toThrowError(
        new ModelNotTrainedError(),
      );
    });

    it('should throw error if the python script throws', async () => {
      const fakeChildProcess = new FakeChildProcess({
        stdout: new Readable({
          async read() {
            this.push(null);
          },
        }),
        stderr: new Readable({
          read() {
            this.push('Python script error');
            this.push(null);
          },
        }),
      });
      childProcess.spawn.mockReturnValue(fakeChildProcess);

      await expect(sut.predict(new UniqueEntityID())).rejects.toThrow(
        new PythonScriptError(1, 'Python script error'),
      );
    });
  });

  describe('train()', () => {
    function makeTrainData(trainData?: TrainData[]): AsyncGenerator<TrainData> {
      const _trainData = trainData ?? [
        {
          sellId: new UniqueEntityID(),
          productId: new UniqueEntityID(),
          unitPrice: 1,
          quantity: 100,
        },
      ];

      return (async function* () {
        for (const data of _trainData) {
          yield data;
        }
      })();
    }

    it('should throw if the python is not installed', async () => {
      childProcess.exec.mockImplementation((command, cb) => {
        cb('Python not found', '', '');
        return new FakeChildProcess();
      });

      await expect(sut.train(makeTrainData())).rejects.toThrow(
        new MissingDependencyError(
          'Python',
          'Python não está instalado na máquina.',
        ),
      );
    });

    it('should train the model', async () => {
      const fakeChildProcess = new FakeChildProcess();
      childProcess.spawn.mockReturnValue(fakeChildProcess);

      const trainData = [
        {
          sellId: new UniqueEntityID(),
          productId: new UniqueEntityID(),
          unitPrice: 1,
          quantity: 100,
        },
        {
          sellId: new UniqueEntityID(),
          productId: new UniqueEntityID(),
          unitPrice: 2,
          quantity: 200,
        },
      ];

      await sut.train(makeTrainData(trainData));
      const expectedModelPath = path.join(
        PyProductSimilarityModel.MODEL_DIR,
        `model-${now.valueOf()}`,
      );

      const expectedCsvPath = path.join(
        expectedModelPath,
        PyProductSimilarityModel.TRAIN_DATA_FILE,
      );
      const createdCsv = fs.readFileSync(expectedCsvPath, 'utf-8');

      expect(createdCsv).toBeDefined();
      const expectedCsv = trainData.reduce(
        (acc, { sellId, productId, unitPrice, quantity }) => {
          return (
            acc +
            `${quantity},${unitPrice},${sellId.toString()},${productId.toString()}\n`
          );
        },
        'quantidade_produto,preco_unitario,id_venda,id_produto\n',
      );

      expect(createdCsv).toEqual(expectedCsv);

      expect(childProcess.spawn).toHaveBeenCalledWith('python3', [
        PyProductSimilarityModel.TRAIN_PYTHON_SCRIPT,
        expectedCsvPath,
        expectedModelPath,
      ]);
    });

    it('should delete old model if exists', async () => {
      vol.reset();
      vol.fromNestedJSON({
        [PyProductSimilarityModel.MODEL_DIR]: {
          'model-123': {
            'model.pkl': 'model',
            'matriz.pkl': 'matrix',
          },
        },
      });
      const oldModelPath = path.join(
        PyProductSimilarityModel.MODEL_DIR,
        'model-123',
      );
      const newModelPath = path.join(
        PyProductSimilarityModel.MODEL_DIR,
        `model-${now.valueOf()}`,
      );

      const oldExists = fs.existsSync(oldModelPath);
      expect(oldExists).toBe(true);

      expect(fs.existsSync(newModelPath)).toBe(false);

      const fakeChildProcess = new FakeChildProcess();
      childProcess.spawn.mockReturnValue(fakeChildProcess);

      await sut.train(makeTrainData());

      expect(fs.existsSync(oldModelPath)).toBe(false);
      expect(fs.existsSync(newModelPath)).toBe(true);
    });

    it('should throw error if the python script throws', async () => {
      const fakeChildProcess = new FakeChildProcess({
        stdout: new Readable({
          async read() {
            this.push(null);
          },
        }),
        stderr: new Readable({
          read() {
            this.push('Python script error');
            this.push(null);
          },
        }),
      });
      childProcess.spawn.mockReturnValue(fakeChildProcess);

      await expect(sut.train(makeTrainData())).rejects.toThrow(
        new PythonScriptError(1, 'Python script error'),
      );
    });
  });
});
