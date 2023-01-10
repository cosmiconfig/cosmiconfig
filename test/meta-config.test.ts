import fs from 'fs';
import { cosmiconfig, cosmiconfigSync } from '../src';
import { TempDir } from './util';
import SpyInstance = jest.SpyInstance;

describe('cosmiconfig meta config', () => {
  const temp = new TempDir();
  beforeEach(() => {
    temp.clean();
  });

  afterAll(() => {
    // Remove temp.dir created for tests
    temp.deleteTempDir();
  });

  describe('uses user-configured searchPlaces without placeholders', () => {
    const currentDir = process.cwd();

    beforeEach(() => {
      temp.createDir('sub');
      temp.createFile('.foorc', 'a: b');
      temp.createFile('.foo-config', 'a: c');

      process.chdir(temp.dir);
    });

    afterEach(() => {
      process.chdir(currentDir);
    });

    async function runTest() {
      const file = temp.absolutePath('.foo-config');
      const startDir = temp.absolutePath('sub');
      const explorerOptions = { stopDir: temp.absolutePath('.') };

      const readFileSyncSpy = jest.spyOn(fs, 'readFileSync');
      const explorer = cosmiconfig('foo', explorerOptions);
      expect(
        temp
          .getSpyPathCalls(readFileSyncSpy)
          .filter((path) => !path.includes('/node_modules/')),
      ).toEqual([
        'package.json',
        '.config.json',
        '.config.yaml',
        '.config.yml',
      ]);
      readFileSyncSpy.mockClear();

      const readFileSpy = jest.spyOn(fs, 'readFile');
      const result = await explorer.search(startDir);
      expect(temp.getSpyPathCalls(readFileSpy)).toEqual([
        'sub/.foo-config',
        'sub/.foo.config.yml',
        '.foo-config',
      ]);

      expect(result).toEqual({
        config: { a: 'c' },
        filepath: file,
      });
    }

    test('without placeholder', async () => {
      temp.createFile(
        '.config.yml',
        'cosmiconfig:\n  searchPlaces: [".foo-config", ".foo.config.yml"]',
      );
      await runTest();
    });

    test('with placeholder', async () => {
      temp.createFile(
        '.config.yml',
        'cosmiconfig:\n  searchPlaces: [".{name}-config", ".{name}.config.yml"]',
      );
      await runTest();
    });
  });

  test('ignores meta file without cosmiconfig key', async () => {
    temp.createFile('.config.yml', 'foo:\n  a: c');

    temp.createDir('sub');
    temp.createFile('.foorc', 'a: b');

    const currentDir = process.cwd();
    process.chdir(temp.dir);

    const startDir = temp.absolutePath('sub');
    const explorerOptions = { stopDir: temp.absolutePath('.') };

    const readFileSyncSpy = jest.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfig('foo', explorerOptions);

    expect(
      temp
        .getSpyPathCalls(readFileSyncSpy)
        .filter((path) => !path.includes('/node_modules/')),
    ).toEqual([
      'package.json',
      '.config.json',
      '.config.yaml',
      '.config.yml',
      '.config.js',
      '.config.cjs',
    ]);

    const readFileSpy = jest.spyOn(fs, 'readFile');
    const result = await explorer.search(startDir);
    expect(temp.getSpyPathCalls(readFileSpy)).toEqual([
      'sub/package.json',
      'sub/.foorc',
      'sub/.foorc.json',
      'sub/.foorc.yaml',
      'sub/.foorc.yml',
      'sub/.foorc.js',
      'sub/.foorc.cjs',
      'sub/.config/foorc',
      'sub/.config/foorc.json',
      'sub/.config/foorc.yaml',
      'sub/.config/foorc.yml',
      'sub/.config/foorc.js',
      'sub/.config/foorc.cjs',
      'sub/foo.config.js',
      'sub/foo.config.cjs',
      'package.json',
      '.foorc',
    ]);

    expect(result).toEqual({
      config: { a: 'b' },
      filepath: temp.absolutePath('.foorc'),
    });

    process.chdir(currentDir);
  });

  describe('checks config in meta file', () => {
    const currentDir = process.cwd();

    beforeEach(() => {
      temp.createDir('sub');
      temp.createFile('.foo-config', 'a: c');
      process.chdir(temp.dir);
    });

    afterEach(() => {
      process.chdir(currentDir);
    });

    describe('not existing', () => {
      beforeEach(() => {
        temp.createFile(
          '.config.yml',
          'cosmiconfig:\n  searchPlaces: [".foo-config"]\n  searchInThisFile: true',
        );
      });

      const file = temp.absolutePath('.foo-config');
      const explorerOptions = { stopDir: temp.absolutePath('.') };

      function checkResult(
        constructFiles: Array<string>,
        readFileSpy: SpyInstance,
        result: any,
      ) {
        expect(
          constructFiles.filter((path) => !path.includes('/node_modules/')),
        ).toEqual([
          'package.json',
          '.config.json',
          '.config.yaml',
          '.config.yml',
        ]);

        expect(
          temp
            .getSpyPathCalls(readFileSpy)
            .filter((path) => !path.includes('/node_modules/')),
        ).toEqual(['.config.yml', '.foo-config']);
        expect(result).toEqual({
          config: { a: 'c' },
          filepath: file,
        });
      }

      test('async', async () => {
        const readFileSyncSpy = jest.spyOn(fs, 'readFileSync');
        const explorer = cosmiconfig('foo', explorerOptions);
        const constructFiles = temp.getSpyPathCalls(readFileSyncSpy);
        readFileSyncSpy.mockClear();

        const readFileSpy = jest.spyOn(fs, 'readFile');
        const result = await explorer.search(temp.dir);
        checkResult(constructFiles, readFileSpy, result);
      });

      test('sync', () => {
        const readFileSyncSpy = jest.spyOn(fs, 'readFileSync');
        const explorer = cosmiconfigSync('foo', explorerOptions);
        const constructFiles = temp.getSpyPathCalls(readFileSyncSpy);

        readFileSyncSpy.mockClear();
        const result = explorer.search(temp.dir);
        checkResult(constructFiles, readFileSyncSpy, result);
      });
    });

    describe('existing', () => {
      beforeEach(() => {
        temp.createFile(
          '.config.yml',
          'cosmiconfig:\n  searchInThisFile: true\nfoo:\n  a: d',
        );
      });

      function checkResult(readFileSpy: SpyInstance, result: any) {
        expect(temp.getSpyPathCalls(readFileSpy)).toEqual(['.config.yml']);
        expect(result).toEqual({
          config: { a: 'd' },
          filepath: temp.absolutePath('.config.yml'),
        });
      }

      const explorerOptions = { stopDir: temp.absolutePath('.') };

      test('async', async () => {
        const explorer = cosmiconfig('foo', explorerOptions);
        const readFileSpy = jest.spyOn(fs, 'readFile');
        const result = await explorer.search(temp.dir);
        checkResult(readFileSpy, result);
      });

      test('sync', () => {
        const explorer = cosmiconfigSync('foo', explorerOptions);
        const readFileSpy = jest.spyOn(fs, 'readFileSync');
        const result = explorer.search(temp.dir);
        checkResult(readFileSpy, result);
      });
    });
  });
});
