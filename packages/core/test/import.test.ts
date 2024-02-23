import { afterAll, beforeEach, describe, expect, test } from 'vitest';
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
      temp.createJsonFile('foo.base.json', { bar: 3, baz: 4 });
      temp.createJsonFile('foo.json', {
        $import: 'foo.base.json',
        foo: 1,
        bar: 2,
      });
    });

    const file = temp.absolutePath('foo.json');
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
      temp.createJsonFile('foo.base.json', { bar: 3, baz: 4 });
      temp.createJsonFile('foo.base2.json', { baz: 5 });
      temp.createJsonFile('foo.json', {
        $import: ['foo.base.json', 'foo.base2.json'],
        foo: 1,
        bar: 2,
      });
    });

    const file = temp.absolutePath('foo.json');
    const checkResult = (result: any) => {
      expect(result.config).toEqual({ foo: 1, bar: 2, baz: 5 });
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
      temp.createJsonFile('foo.base.json', { foo: [1, 2] });
      temp.createJsonFile('foo.json', {
        $import: 'foo.base.json',
        foo: [3, 4],
      });
    });

    const file = temp.absolutePath('foo.json');
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
      temp.createJsonFile('foo.base.json', { foo: [1, 2] });
      temp.createJsonFile('foo.json', {
        $import: 'foo.base.json',
        foo: [3, 4],
      });
    });

    const file = temp.absolutePath('foo.json');
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
      temp.createJsonFile('foo.base.json', { outer: { bar: 3, baz: 4 } });
      temp.createJsonFile('foo.json', {
        $import: 'foo.base.json',
        outer: { foo: 1, bar: 2 },
      });
    });

    const file = temp.absolutePath('foo.json');
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

  describe('merges different file formats', () => {
    beforeEach(() => {
      temp.createFile('foo.base.cjs', 'module.exports = { bar: 3, baz: 4 };');
      temp.createJsonFile('foo.json', {
        $import: 'foo.base.cjs',
        foo: 1,
        bar: 2,
      });
    });

    const file = temp.absolutePath('foo.json');
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

  describe('imports a file which in turn imports another file', () => {
    beforeEach(() => {
      temp.createJsonFile('foo.base.base.json', { bar: 3, baz: 4 });
      temp.createJsonFile('foo.base.json', {
        $import: 'foo.base.base.json',
        baz: 5,
      });
      temp.createJsonFile('foo.json', { $import: 'foo.base.json', foo: 1 });
    });

    const file = temp.absolutePath('foo.json');
    const checkResult = (result: any) => {
      expect(result.config).toEqual({ foo: 1, bar: 3, baz: 5 });
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

  describe("errors when importing something that's not a string", () => {
    beforeEach(() => {
      temp.createJsonFile('foo.json', { $import: 3, foo: 1, bar: 2 });
    });

    const file = temp.absolutePath('foo.json');

    test('async', async () => {
      await expect(
        async () => await cosmiconfig('import-tests').load(file),
      ).rejects.toThrow('a string or a list of strings');
    });

    test('sync', () => {
      expect(() => cosmiconfigSync('import-tests').load(file)).toThrow(
        'a string or a list of strings',
      );
    });
  });

  describe('errors when importing a file that does not exist', () => {
    beforeEach(() => {
      temp.createJsonFile('foo.json', {
        $import: 'foo.base.json',
        foo: 1,
        bar: 2,
      });
    });

    const file = temp.absolutePath('foo.json');

    test('async', async () => {
      await expect(
        async () => await cosmiconfig('import-tests').load(file),
      ).rejects.toThrow('no such file or directory');
    });

    test('sync', () => {
      expect(() => cosmiconfigSync('import-tests').load(file)).toThrow(
        'no such file or directory',
      );
    });
  });

  describe('errors when trying to import itself', () => {
    beforeEach(() => {
      temp.createJsonFile('foo.json', { $import: 'foo.json', foo: 1, bar: 2 });
    });

    const file = temp.absolutePath('foo.json');

    test('async', async () => {
      await expect(
        async () => await cosmiconfig('import-tests').load(file),
      ).rejects.toThrow('Self-import detected');
    });

    test('sync', () => {
      expect(() => cosmiconfigSync('import-tests').load(file)).toThrow(
        'Self-import detected',
      );
    });
  });

  describe('errors when trying to import circularly', () => {
    beforeEach(() => {
      temp.createJsonFile('foo.base.json', { $import: 'foo.base2.json' });
      temp.createJsonFile('foo.base2.json', { $import: 'foo.base.json' });
      temp.createJsonFile('foo.json', {
        $import: 'foo.base.json',
        foo: 1,
        bar: 2,
      });
    });

    const file = temp.absolutePath('foo.json');

    test('async', async () => {
      await expect(
        async () => await cosmiconfig('import-tests').load(file),
      ).rejects.toThrow('Circular import detected');
    });

    test('sync', () => {
      expect(() => cosmiconfigSync('import-tests').load(file)).toThrow(
        'Circular import detected',
      );
    });
  });
});
