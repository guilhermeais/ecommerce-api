import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Logger } from '@/shared/logger';
import { vol, fs } from 'memfs';
import { FakeChildProcess } from 'test/fake-child-process';
import { makeFakeLogger } from 'test/shared/logger.mock';
import { Mock } from 'vitest';
import { PyProductSimilarityModel } from './py-product-similarity-model';
import { MissingDependencyError } from './errors/missing-dependency-error';
import { ModelNotTrainedError } from './errors/model-not-trained-error';
import { Readable } from 'stream';
import { faker } from '@faker-js/faker';
import { setTimeout } from 'timers/promises';
import { PytonScriptError } from './errors/python-script-error';

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

  beforeEach(async () => {
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

    it.only('should throw error if the python script throws', async () => {
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
        new PytonScriptError(1, 'Python script error'),
      );
    });
  });
});
