import { cosmiconfig, cosmiconfigSync } from '../src';
import { TempDir } from './util';

describe('imports', () => {
  const temp = new TempDir();
  beforeEach(() => {
    temp.clean();
  });

  afterAll(() => {
    // Remove temp.dir created for tests
    temp.deleteTempDir();
  });

  describe('imports one file', () => {
    beforeEach(() => {
      temp.createFile('foo.base.yml', 'bar: 3\nbaz: 4');
      temp.createFile('foo.yml', '$import: foo.base.yml\nfoo: 1\nbar: 2');
    });

    const file = temp.absolutePath('foo.yml');
    const checkResult = (result: any) => {
      expect(result.config).toEqual({ foo: 1, bar: 2, baz: 4 });
    };

    test('async', async () => {
      const result = await cosmiconfig('import-tests').load(file);
      checkResult(result);
    });

    test('sync', () => {
      const result = cosmiconfigSync('import-tests').load(file);
      checkResult(result);
    });
  });

  describe('imports multiple files', () => {
    beforeEach(() => {
      temp.createFile('foo.base.yml', 'bar: 3');
      temp.createFile('foo.base2.yml', 'baz: 4');
      temp.createFile(
        'foo.yml',
        '$import:\n  - foo.base.yml\n  - foo.base2.yml\nfoo: 1\nbar: 2',
      );
    });

    const file = temp.absolutePath('foo.yml');
    const checkResult = (result: any) => {
      expect(result.config).toEqual({ foo: 1, bar: 2, baz: 4 });
    };

    test('async', async () => {
      const result = await cosmiconfig('import-tests').load(file);
      checkResult(result);
    });

    test('sync', () => {
      const result = cosmiconfigSync('import-tests').load(file);
      checkResult(result);
    });
  });

  describe('merges arrays by default', () => {
    beforeEach(() => {
      temp.createFile('foo.base.yml', 'foo: [1, 2]');
      temp.createFile('foo.yml', '$import: foo.base.yml\nfoo: [3, 4]');
    });

    const file = temp.absolutePath('foo.yml');
    const checkResult = (result: any) => {
      expect(result.config).toEqual({ foo: [1, 2, 3, 4] });
    };

    test('async', async () => {
      const result = await cosmiconfig('import-tests').load(file);
      checkResult(result);
    });

    test('sync', () => {
      const result = cosmiconfigSync('import-tests').load(file);
      checkResult(result);
    });
  });

  describe('overwrites arrays if merge is disabled', () => {
    beforeEach(() => {
      temp.createFile('foo.base.yml', 'foo: [1, 2]');
      temp.createFile('foo.yml', '$import: foo.base.yml\nfoo: [3, 4]');
    });

    const file = temp.absolutePath('foo.yml');
    const checkResult = (result: any) => {
      expect(result.config).toEqual({ foo: [3, 4] });
    };

    test('async', async () => {
      const result = await cosmiconfig('import-tests', {
        mergeImportArrays: false,
      }).load(file);
      checkResult(result);
    });

    test('sync', () => {
      const result = cosmiconfigSync('import-tests', {
        mergeImportArrays: false,
      }).load(file);
      checkResult(result);
    });
  });

  describe('merges nested objects by default', () => {
    beforeEach(() => {
      temp.createFile('foo.base.yml', 'outer:\n  bar: 3\n  baz: 4');
      temp.createFile(
        'foo.yml',
        '$import: foo.base.yml\nouter:\n  foo: 1\n  bar: 2',
      );
    });

    const file = temp.absolutePath('foo.yml');
    const checkResult = (result: any) => {
      expect(result.config).toEqual({ outer: { foo: 1, bar: 2, baz: 4 } });
    };

    test('async', async () => {
      const result = await cosmiconfig('import-tests').load(file);
      checkResult(result);
    });

    test('sync', () => {
      const result = cosmiconfigSync('import-tests').load(file);
      checkResult(result);
    });
  });
});
