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
      temp.createFile('foo.base.yml', 'bar: 3\nbaz: 4');
      temp.createFile('foo.base2.yml', 'baz: 5');
      temp.createFile(
        'foo.yml',
        '$import:\n  - foo.base.yml\n  - foo.base2.yml\nfoo: 1\nbar: 2',
      );
    });

    const file = temp.absolutePath('foo.yml');
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

  describe('merges different file formats', () => {
    beforeEach(() => {
      temp.createFile('foo.base.json', '{"bar": 3, "baz": 4}');
      temp.createFile('foo.yml', '$import: foo.base.json\nfoo: 1\nbar: 2');
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

  describe('imports a file which in turn imports another file', () => {
    beforeEach(() => {
      temp.createFile('foo.base.base.yml', 'bar: 3\nbaz: 4');
      temp.createFile('foo.base.yml', '$import: foo.base.base.yml\nbaz: 5');
      temp.createFile('foo.yml', '$import: foo.base.yml\nfoo: 1');
    });

    const file = temp.absolutePath('foo.yml');
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
      temp.createFile('foo.yml', '$import: 3\nfoo: 1\nbar: 2');
    });

    const file = temp.absolutePath('foo.yml');

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
      temp.createFile('foo.yml', '$import: foo.base.yml\nfoo: 1\nbar: 2');
    });

    const file = temp.absolutePath('foo.yml');

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
      temp.createFile('foo.yml', '$import: foo.yml\nfoo: 1\nbar: 2');
    });

    const file = temp.absolutePath('foo.yml');

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
      temp.createFile('foo.base.yml', '$import: foo.base2.yml');
      temp.createFile('foo.base2.yml', '$import: foo.base.yml');
      temp.createFile('foo.yml', '$import: foo.base.yml\nfoo: 1\nbar: 2');
    });

    const file = temp.absolutePath('foo.yml');

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
