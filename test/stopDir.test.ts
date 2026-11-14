import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { cosmiconfig, cosmiconfigSync, Options, OptionsSync } from '../src';
import { TempDir } from './util';

const temp = new TempDir();

beforeEach(() => {
  temp.clean();
});

afterAll(() => {
  temp.deleteTempDir();
});

describe('dynamic stopDir predicate', () => {
  describe('stops upward traversal at matching ancestor directory (e.g. node_modules)', () => {
    beforeEach(() => {
      temp.createDir('project/node_modules/pkg/sub');
      temp.createFile('project/.foorc.yml', 'fromProject: true');
    });

    const startDir = temp.absolutePath('project/node_modules/pkg/sub');

    test('async', async () => {
      const visited: Array<string> = [];
      const explorer = cosmiconfig('foo', {
        searchPlaces: ['.foorc.yml'],
        stopDir(dir) {
          visited.push(dir);
          return path.basename(dir) === 'node_modules';
        },
      });

      const readFileSpy = vi.spyOn(fsPromises, 'readFile');
      const result = await explorer.search(startDir);

      expect(result).toBeNull();
      expect(visited).toEqual([
        temp.absolutePath('project/node_modules/pkg/sub'),
        temp.absolutePath('project/node_modules/pkg'),
        temp.absolutePath('project/node_modules'),
      ]);
      expect(temp.getSpyPathCalls(readFileSpy)).not.toContain(
        'project/.foorc.yml',
      );
    });

    test('sync', () => {
      const visited: Array<string> = [];
      const explorer = cosmiconfigSync('foo', {
        searchPlaces: ['.foorc.yml'],
        stopDir(dir) {
          visited.push(dir);
          return path.basename(dir) === 'node_modules';
        },
      });

      const readFileSpy = vi.spyOn(fs, 'readFileSync');
      const result = explorer.search(startDir);

      expect(result).toBeNull();
      expect(visited).toEqual([
        temp.absolutePath('project/node_modules/pkg/sub'),
        temp.absolutePath('project/node_modules/pkg'),
        temp.absolutePath('project/node_modules'),
      ]);
      expect(temp.getSpyPathCalls(readFileSpy)).not.toContain(
        'project/.foorc.yml',
      );
    });
  });

  describe('finds config inside or at the directory where predicate returns true', () => {
    beforeEach(() => {
      temp.createDir('project/boundary/sub');
      temp.createFile('project/boundary/.foorc.yml', 'atBoundary: true');
      temp.createFile('project/.foorc.yml', 'aboveBoundary: true');
    });

    const startDir = temp.absolutePath('project/boundary/sub');
    const explorerOptions = {
      searchPlaces: ['.foorc.yml'],
      stopDir: (dir: string) => path.basename(dir) === 'boundary',
    } satisfies Partial<Options | OptionsSync>;

    const expectedResult = {
      config: { atBoundary: true },
      filepath: temp.absolutePath('project/boundary/.foorc.yml'),
    };

    test('async', async () => {
      const explorer = cosmiconfig('foo', explorerOptions);
      const result = await explorer.search(startDir);
      expect(result).toEqual(expectedResult);
    });

    test('sync', () => {
      const explorer = cosmiconfigSync('foo', explorerOptions);
      const result = explorer.search(startDir);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('stops immediately after startDir when predicate matches startDir', () => {
    beforeEach(() => {
      temp.createDir('a/b');
      temp.createFile('a/.foorc.yml', 'inParent: true');
    });

    const startDir = temp.absolutePath('a/b');

    test('async returns null when startDir has no config', async () => {
      const visited: Array<string> = [];
      const explorer = cosmiconfig('foo', {
        searchPlaces: ['.foorc.yml'],
        stopDir(dir) {
          visited.push(dir);
          return dir === startDir;
        },
      });

      const result = await explorer.search(startDir);
      expect(result).toBeNull();
      expect(visited).toEqual([startDir]);
    });

    test('sync returns null when startDir has no config', () => {
      const visited: Array<string> = [];
      const explorer = cosmiconfigSync('foo', {
        searchPlaces: ['.foorc.yml'],
        stopDir(dir) {
          visited.push(dir);
          return dir === startDir;
        },
      });

      const result = explorer.search(startDir);
      expect(result).toBeNull();
      expect(visited).toEqual([startDir]);
    });

    test('async still finds config in startDir when predicate matches startDir', async () => {
      temp.createFile('a/b/.foorc.yml', 'inStart: true');
      const explorer = cosmiconfig('foo', {
        searchPlaces: ['.foorc.yml'],
        stopDir: () => true,
      });

      const result = await explorer.search(startDir);
      expect(result).toEqual({
        config: { inStart: true },
        filepath: temp.absolutePath('a/b/.foorc.yml'),
      });
    });

    test('sync still finds config in startDir when predicate matches startDir', () => {
      temp.createFile('a/b/.foorc.yml', 'inStart: true');
      const explorer = cosmiconfigSync('foo', {
        searchPlaces: ['.foorc.yml'],
        stopDir: () => true,
      });

      const result = explorer.search(startDir);
      expect(result).toEqual({
        config: { inStart: true },
        filepath: temp.absolutePath('a/b/.foorc.yml'),
      });
    });
  });

  describe('reuses cached explorer cleanly across searches inside and outside boundary', () => {
    beforeEach(() => {
      temp.createDir('project/node_modules/pkg/sub');
      temp.createDir('project/src/nested');
      temp.createFile('project/.foorc.yml', 'rootConfig: true');
    });

    const explorerOptions = {
      searchPlaces: ['.foorc.yml'],
      stopDir: (dir: string) => path.basename(dir) === 'node_modules',
    } satisfies Partial<Options | OptionsSync>;

    test('async', async () => {
      const explorer = cosmiconfig('foo', explorerOptions);
      expect(
        await explorer.search(
          temp.absolutePath('project/node_modules/pkg/sub'),
        ),
      ).toBeNull();
      expect(
        await explorer.search(temp.absolutePath('project/src/nested')),
      ).toEqual({
        config: { rootConfig: true },
        filepath: temp.absolutePath('project/.foorc.yml'),
      });
    });

    test('sync', () => {
      const explorer = cosmiconfigSync('foo', explorerOptions);
      expect(
        explorer.search(temp.absolutePath('project/node_modules/pkg/sub')),
      ).toBeNull();
      expect(explorer.search(temp.absolutePath('project/src/nested'))).toEqual({
        config: { rootConfig: true },
        filepath: temp.absolutePath('project/.foorc.yml'),
      });
    });
  });

  describe('falls back to filesystem root when predicate always returns false', () => {
    beforeEach(() => {
      temp.createDir('a/b');
    });

    const startDir = temp.absolutePath('a/b');
    const fsRoot = path.parse(startDir).root;
    const moduleName = 'cosmiconfig-dynamic-stopdir-root-fallback-test';

    test('async', async () => {
      const visited: Array<string> = [];
      const explorer = cosmiconfig(moduleName, {
        searchPlaces: [`.${moduleName}rc.yml`],
        stopDir(dir) {
          visited.push(dir);
          return false;
        },
      });

      const result = await explorer.search(startDir);
      expect(result).toBeNull();
      expect(visited[0]).toBe(startDir);
      expect(visited[visited.length - 1]).toBe(fsRoot);
    });

    test('sync', () => {
      const visited: Array<string> = [];
      const explorer = cosmiconfigSync(moduleName, {
        searchPlaces: [`.${moduleName}rc.yml`],
        stopDir(dir) {
          visited.push(dir);
          return false;
        },
      });

      const result = explorer.search(startDir);
      expect(result).toBeNull();
      expect(visited[0]).toBe(startDir);
      expect(visited[visited.length - 1]).toBe(fsRoot);
    });
  });

  test('throws when predicate stopDir is combined with searchStrategy other than "global"', () => {
    const expectedError =
      'Can not supply `stopDir` option with `searchStrategy` other than "global"';

    expect(() =>
      cosmiconfig('foo', {
        searchStrategy: 'none',
        stopDir: () => true,
      }),
    ).toThrow(expectedError);

    expect(() =>
      cosmiconfigSync('foo', {
        searchStrategy: 'project',
        stopDir: () => true,
      }),
    ).toThrow(expectedError);
  });
});
