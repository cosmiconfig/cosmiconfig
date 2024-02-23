import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { cosmiconfig, cosmiconfigSync, Options, OptionsSync } from '../src';
import { TempDir } from './util';

const temp = new TempDir();

describe('search strategies', () => {
  describe('none', () => {
    beforeEach(() => {
      temp.clean();
      temp.createFile('a/b/.foorc.yml', 'result: 1');
      temp.createFile('a/.foorc.yml', 'result: 2');
      temp.createFile('.foorc.yml', 'result: 3');
    });

    const startDir = temp.absolutePath('a/b');
    const explorerOptions = { searchStrategy: 'none' } satisfies Partial<
      Options | OptionsSync
    >;

    const checkResult = (result: any) => {
      expect(result).toEqual({
        config: { result: 1 },
        filepath: temp.absolutePath('a/b/.foorc.yml'),
      });
    };

    test('async', async () => {
      const explorer = cosmiconfig('foo', explorerOptions);
      const result = await explorer.search(startDir);
      checkResult(result);
    });

    test('sync', () => {
      const explorer = cosmiconfigSync('foo', explorerOptions);
      const result = explorer.search(startDir);
      checkResult(result);
    });
  });

  describe('global', () => {
    describe('finds config in parent directories', () => {
      beforeEach(() => {
        temp.clean();
        temp.createDir('a/b');
        temp.createFile('a/.barrc.yml', 'result: 4');
        temp.createFile('.barrc.yml', 'result: 5');
      });

      const startDir = temp.absolutePath('a/b');
      const explorerOptions = {
        searchStrategy: 'global',
        stopDir: temp.absolutePath('.'),
      } satisfies Partial<Options | OptionsSync>;

      const checkResult = (result: any) => {
        expect(result).toEqual({
          config: { result: 4 },
          filepath: temp.absolutePath('a/.barrc.yml'),
        });
      };

      test('async', async () => {
        const explorer = cosmiconfig('bar', explorerOptions);
        const result = await explorer.search(startDir);
        checkResult(result);
      });

      test('sync', () => {
        const explorer = cosmiconfigSync('bar', explorerOptions);
        const result = explorer.search(startDir);
        checkResult(result);
      });
    });

    if (process.platform === 'linux') {
      describe('finds config in OS default directory (XDG)', () => {
        const origConfigFolder = process.env.XDG_CONFIG_HOME;
        beforeEach(() => {
          temp.clean();
          temp.createDir('a/b');
          temp.createFile('config/foo/config.yml', 'result: 6');
          process.env.XDG_CONFIG_HOME = temp.absolutePath('config');
        });
        afterEach(() => {
          process.env.XDG_CONFIG_HOME = origConfigFolder;
        });

        const startDir = temp.absolutePath('a/b');
        const explorerOptions = {
          searchStrategy: 'global',
          stopDir: temp.absolutePath('.'),
        } satisfies Partial<Options | OptionsSync>;

        const checkResult = (result: any) => {
          expect(result).toEqual({
            config: { result: 6 },
            filepath: temp.absolutePath('config/foo/config.yml'),
          });
        };

        test('async', async () => {
          const explorer = cosmiconfig('foo', explorerOptions);
          const result = await explorer.search(startDir);
          checkResult(result);
        });

        test('sync', () => {
          const explorer = cosmiconfigSync('foo', explorerOptions);
          const result = explorer.search(startDir);
          checkResult(result);
        });
      });
    }
  });

  describe('project', () => {
    beforeEach(() => {
      temp.clean();
      temp.createDir('a/b');
      temp.createFile('a/package.json', '');
      temp.createFile('.bazrc.yml', 'result: 6');
    });

    const startDir = temp.absolutePath('a/b');
    const explorerOptions = {
      searchStrategy: 'project',
    } satisfies Partial<Options | OptionsSync>;

    test('async', async () => {
      const explorer = cosmiconfig('bar', explorerOptions);
      const result = await explorer.search(startDir);
      expect(result).toBeNull();
    });

    test('sync', () => {
      const explorer = cosmiconfigSync('bar', explorerOptions);
      const result = explorer.search(startDir);
      expect(result).toBeNull();
    });
  });
});
