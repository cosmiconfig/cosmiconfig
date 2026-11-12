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

    describe.each([undefined, 'none'] as const)(
      'file input with searchStrategy=%s',
      (searchStrategy) => {
        beforeEach(() => {
          temp.createFile('a/b/index.js', '');
          temp.createFile('a/b/other.js', '');
        });

        test('async shares the directory cache', async () => {
          const explorer = cosmiconfig('foo', { searchStrategy });
          const result = await explorer.search(
            temp.absolutePath('a/b/index.js'),
          );
          checkResult(result);
          expect(await explorer.search(temp.absolutePath('a/b/other.js'))).toBe(
            result,
          );
          expect(await explorer.search(startDir)).toBe(result);
          explorer.clearSearchCache();
          expect(await explorer.search(startDir)).not.toBe(result);
        });

        test('sync shares the directory cache', () => {
          const explorer = cosmiconfigSync('foo', { searchStrategy });
          const result = explorer.search(temp.absolutePath('a/b/index.js'));
          checkResult(result);
          expect(explorer.search(temp.absolutePath('a/b/other.js'))).toBe(
            result,
          );
          expect(explorer.search(startDir)).toBe(result);
          explorer.clearSearchCache();
          expect(explorer.search(startDir)).not.toBe(result);
        });
      },
    );

    test("async does not search above a file's directory", async () => {
      temp.createFile('a/b/c/index.js', '');
      const explorer = cosmiconfig('foo', explorerOptions);
      expect(
        await explorer.search(temp.absolutePath('a/b/c/index.js')),
      ).toBeNull();
    });

    test("sync does not search above a file's directory", () => {
      temp.createFile('a/b/c/index.js', '');
      const explorer = cosmiconfigSync('foo', explorerOptions);
      expect(explorer.search(temp.absolutePath('a/b/c/index.js'))).toBeNull();
    });

    test('async does not search the parent of a missing path', async () => {
      const explorer = cosmiconfig('foo', explorerOptions);
      expect(
        await explorer.search(temp.absolutePath('a/b/missing')),
      ).toBeNull();
    });

    test('sync does not search the parent of a missing path', () => {
      const explorer = cosmiconfigSync('foo', explorerOptions);
      expect(explorer.search(temp.absolutePath('a/b/missing'))).toBeNull();
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

      describe('does not deadlock when cwd is the global config dir or a descendant of it', () => {
        const origConfigFolder = process.env.XDG_CONFIG_HOME;
        beforeEach(() => {
          temp.clean();
          temp.createFile('config/foo/config.yml', 'result: 6');
          process.env.XDG_CONFIG_HOME = temp.absolutePath('config');
        });
        afterEach(() => {
          process.env.XDG_CONFIG_HOME = origConfigFolder;
        });

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

        test('async, start dir = global config dir', async () => {
          const explorer = cosmiconfig('foo', explorerOptions);
          const result = await explorer.search(temp.absolutePath('config/foo'));
          checkResult(result);
        }, 2000);

        test('async, start dir = descendant of global config dir', async () => {
          temp.createDir('config/foo/sub');
          const explorer = cosmiconfig('foo', explorerOptions);
          const result = await explorer.search(
            temp.absolutePath('config/foo/sub'),
          );
          checkResult(result);
        }, 2000);

        test('sync, start dir = global config dir', () => {
          const explorer = cosmiconfigSync('foo', explorerOptions);
          const result = explorer.search(temp.absolutePath('config/foo'));
          checkResult(result);
        });

        test('sync, start dir = descendant of global config dir', () => {
          temp.createDir('config/foo/sub');
          const explorer = cosmiconfigSync('foo', explorerOptions);
          const result = explorer.search(temp.absolutePath('config/foo/sub'));
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
      temp.createFile('.foorc.yml', 'result: 7');
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

    test('async stops at the first package file', async () => {
      const explorer = cosmiconfig('foo', explorerOptions);
      const result = await explorer.search(startDir);
      expect(result).toBeNull();
    });

    test('sync stops at the first package file', () => {
      const explorer = cosmiconfigSync('foo', explorerOptions);
      const result = explorer.search(startDir);
      expect(result).toBeNull();
    });
  });
});
