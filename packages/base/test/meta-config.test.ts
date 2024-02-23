import { Options, OptionsSync } from '@cosmiconfig/types';
import fs from 'fs';
import fsPromises from 'fs/promises';
import {
  SpyInstance,
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { cosmiconfigBasic, cosmiconfigBasicSync } from '../src/basic';
import { TempDir } from './util';

describe('cosmiconfigBasic meta config', () => {
  const temp = new TempDir();

  beforeEach(() => {
    temp.clean();
  });

  afterAll(() => {
    // Remove temp.dir created for tests
    temp.deleteTempDir();
  });

  test('throws when trying to supply loaders', () => {
    temp.createFile(
      '.config/config.json',
      JSON.stringify({ cosmiconfig: { loaders: [] } }),
    );

    const currentDir = process.cwd();
    process.chdir(temp.dir);

    expect(() => cosmiconfigBasicSync('foo')).toThrow();

    process.chdir(currentDir);
  });

  test('throws when trying to supply searchStrategy', () => {
    temp.createFile(
      '.config/config.json',

      JSON.stringify({ cosmiconfig: { searchStrategy: 'global' } }),
    );

    const currentDir = process.cwd();
    process.chdir(temp.dir);

    expect(() => cosmiconfigBasicSync('foo')).toThrow();

    process.chdir(currentDir);
  });

  describe('uses user-configured searchPlaces without placeholders', () => {
    const currentDir = process.cwd();

    beforeEach(() => {
      temp.createDir('sub');
      temp.createFile('.foorc', JSON.stringify({ a: 'b' }));
      temp.createFile('.foo-config', JSON.stringify({ a: 'c' }));

      process.chdir(temp.dir);
    });

    afterEach(() => {
      process.chdir(currentDir);
    });

    async function runTest() {
      const file = temp.absolutePath('.foo-config');
      const startDir = temp.absolutePath('sub');
      const explorerOptions = { stopDir: temp.absolutePath('.') };

      const readFileSyncSpy = vi.spyOn(fs, 'readFileSync');
      const explorer = cosmiconfigBasic('foo', explorerOptions);
      expect(
        temp
          .getSpyPathCalls(readFileSyncSpy)
          .filter((path) => !path.includes('/node_modules/')),
      ).toEqual(['package.json', '.config/config.json']);
      readFileSyncSpy.mockClear();

      const readFileSpy = vi.spyOn(fsPromises, 'readFile');
      const result = await explorer.search(startDir);
      expect(temp.getSpyPathCalls(readFileSpy)).toEqual([
        '.config/config.json',
        'sub/.foo-config',
        'sub/.foo.config.json',
        '.foo-config',
      ]);

      expect(result).toEqual({
        config: { a: 'c' },
        filepath: file,
      });
    }

    test('without placeholder', async () => {
      temp.createFile(
        '.config/config.json',
        JSON.stringify({
          cosmiconfig: {
            searchPlaces: ['.foo-config', '.foo.config.json'],
            mergeSearchPlaces: false,
          },
        }),
      );
      await runTest();
    });

    test('with placeholder', async () => {
      temp.createFile(
        '.config/config.json',
        JSON.stringify({
          cosmiconfig: {
            searchPlaces: ['.{name}-config', '.{name}.config.json'],
            mergeSearchPlaces: false,
          },
        }),
      );
      await runTest();
    });
  });

  describe('checks config in meta file', () => {
    const currentDir = process.cwd();

    beforeEach(() => {
      temp.createDir('sub');
      temp.createFile('.foo-config', JSON.stringify({ a: 'c' }));
      process.chdir(temp.dir);
    });

    afterEach(() => {
      process.chdir(currentDir);
    });

    describe('not existing', () => {
      beforeEach(() => {
        temp.createFile(
          '.config/config.json',

          JSON.stringify({
            cosmiconfig: {
              searchPlaces: ['.foo-config'],
            },
          }),
        );
      });

      const file = temp.absolutePath('.foo-config');
      const explorerOptions: Partial<Options & OptionsSync> = {
        stopDir: temp.absolutePath('.'),
        ignoreEmptySearchPlaces: false,
      };

      function checkResult(
        constructFiles: Array<string>,
        readFileSpy: SpyInstance,
        result: any,
      ) {
        expect(
          constructFiles.filter((path) => !path.includes('/node_modules/')),
        ).toEqual(['package.json', '.config/config.json']);

        expect(
          temp
            .getSpyPathCalls(readFileSpy)
            .filter((path) => !path.includes('/node_modules/')),
        ).toEqual(['.config/config.json', '.foo-config']);
        expect(result).toEqual({
          config: { a: 'c' },
          filepath: file,
        });
      }

      test('async', async () => {
        const readFileSyncSpy = vi.spyOn(fs, 'readFileSync');
        const explorer = cosmiconfigBasic('foo', explorerOptions);
        const constructFiles = temp.getSpyPathCalls(readFileSyncSpy);
        readFileSyncSpy.mockClear();

        const readFileSpy = vi.spyOn(fsPromises, 'readFile');
        const result = await explorer.search(temp.dir);
        checkResult(constructFiles, readFileSpy, result);
      });

      test('sync', () => {
        const readFileSyncSpy = vi.spyOn(fs, 'readFileSync');
        const explorer = cosmiconfigBasicSync('foo', explorerOptions);
        const constructFiles = temp.getSpyPathCalls(readFileSyncSpy);
        readFileSyncSpy.mockClear();

        const result = explorer.search(temp.dir);
        checkResult(constructFiles, readFileSyncSpy, result);
      });
    });

    describe('existing', () => {
      beforeEach(() => {
        temp.createFile(
          '.config/config.json',
          JSON.stringify({ foo: { a: 'd' } }),
        );
      });

      function checkResult(readFileSpy: SpyInstance, result: any) {
        expect(temp.getSpyPathCalls(readFileSpy)).toEqual([
          '.config/config.json',
        ]);
        expect(result).toEqual({
          config: { a: 'd' },
          filepath: temp.absolutePath('.config/config.json'),
        });
      }

      const explorerOptions = { stopDir: temp.absolutePath('.') };

      test('async', async () => {
        const explorer = cosmiconfigBasic('foo', explorerOptions);
        const readFileSpy = vi.spyOn(fsPromises, 'readFile');
        const result = await explorer.search(temp.dir);
        checkResult(readFileSpy, result);
      });

      test('sync', () => {
        const explorer = cosmiconfigBasicSync('foo', explorerOptions);
        const readFileSpy = vi.spyOn(fs, 'readFileSync');
        const result = explorer.search(temp.dir);
        checkResult(readFileSpy, result);
      });
    });
  });
});
