/* eslint-disable @typescript-eslint/no-extraneous-class,@typescript-eslint/explicit-member-accessibility,@typescript-eslint/no-empty-function*/
import path from 'path';
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  Mock,
  MockInstance,
  SpyInstance,
  test,
  vi,
} from 'vitest';
import {
  Loader,
  Loaders,
  LoaderSync,
  OptionsSync,
  defaultLoaders,
} from '../src';
import { Explorer } from '../src/Explorer';
import { ExplorerSync } from '../src/ExplorerSync';
import { InternalOptions, InternalOptionsSync, Options } from '../src/types';
import { TempDir } from './util';

vi.mock('../src/ExplorerSync', async () => {
  const { ExplorerSync } = await vi.importActual<
    typeof import('../src/ExplorerSync')
  >('../src/ExplorerSync');

  const mock = vi.fn();

  return {
    ExplorerSync: class FakeExplorerSync extends ExplorerSync {
      static mock = mock;
      constructor(options: InternalOptionsSync) {
        mock(options);
        super(options);
      }
    },
  };
});

vi.mock('../src/Explorer', async () => {
  const { Explorer } =
    await vi.importActual<typeof import('../src/Explorer')>('../src/Explorer');

  const mock = vi.fn();

  return {
    Explorer: class FakeExplorer extends Explorer {
      static mock = mock;
      constructor(options: InternalOptions) {
        mock(options);
        super(options);
      }
    },
  };
});

const { cosmiconfig, cosmiconfigSync } = await import('../src/index.js');
const createExplorerSyncMock = (ExplorerSync as any).mock;
const createExplorerMock = (Explorer as any).mock;

const temp = new TempDir();

function getLoaderFunctionsByName(loaders: Loaders) {
  return Object.fromEntries(
    Object.entries(loaders).map(([extension, loader]) => [
      extension,
      loader.name,
    ]),
  );
}

describe('cosmiconfig', () => {
  const moduleName = 'foo';

  beforeEach(() => {
    temp.clean();
  });

  afterAll(() => {
    // Remove temp.dir created for tests
    temp.deleteTempDir();
  });

  describe('creates explorer with default options if not specified', () => {
    const checkResult = (
      mock: SpyInstance,
      instanceNum: number,
      expectedLoaders: any,
      expectedSearchPlaces: any,
      expectedGlobalConfigSearchPlaces: Array<string>,
    ) => {
      const instanceIndex = instanceNum - 1;

      expect(mock.mock.calls.length).toBe(instanceNum);
      expect(mock.mock.calls[instanceIndex].length).toBe(1);

      const { transform, loaders, ...explorerOptions } =
        mock.mock.calls[instanceIndex][0];
      expect(transform.name).toMatch(/identity/);
      const loaderFunctionsByName = getLoaderFunctionsByName(loaders);

      // Vitest adds a number suffix to our functions names,
      // so we can't compare them with strict equals
      for (const [key, value] of Object.entries(loaderFunctionsByName)) {
        expect(value).toContain(expectedLoaders[key]);
      }

      expect(explorerOptions).toEqual({
        moduleName,
        globalConfigSearchPlaces: expectedGlobalConfigSearchPlaces,
        searchPlaces: expectedSearchPlaces,
        ignoreEmptySearchPlaces: true,
        mergeImportArrays: true,
        mergeSearchPlaces: true,
        searchStrategy: 'none',
        metaConfigFilePath: null,
        cache: true,
      });
    };

    test('async', () => {
      cosmiconfig(moduleName);
      checkResult(
        createExplorerMock,
        1,
        {
          '.cjs': 'loadJs',
          '.mjs': 'loadJs',
          '.js': 'loadJs',
          '.json': 'loadJson',
          noExt: 'loadJson',
        },
        [
          'package.json',
          `.${moduleName}rc`,
          `.${moduleName}rc.json`,
          `.${moduleName}rc.js`,
          `.${moduleName}rc.cjs`,
          `.${moduleName}rc.mjs`,
          `.config/${moduleName}rc`,
          `.config/${moduleName}rc.json`,
          `.config/${moduleName}rc.js`,
          `.config/${moduleName}rc.cjs`,
          `.config/${moduleName}rc.mjs`,
          `${moduleName}.config.js`,
          `${moduleName}.config.cjs`,
          `${moduleName}.config.mjs`,
        ],
        ['config', 'config.json', 'config.js', 'config.cjs', 'config.mjs'],
      );
    });

    test('sync', () => {
      cosmiconfigSync(moduleName);
      checkResult(
        createExplorerSyncMock,
        2, // ExplorerSync is called twice (once in getExplorerOptions)
        {
          '.mjs': 'loadJsSync',
          '.cjs': 'loadJsSync',
          '.js': 'loadJsSync',
          '.json': 'loadJson',
          noExt: 'loadJson',
        },
        [
          'package.json',
          `.${moduleName}rc`,
          `.${moduleName}rc.json`,
          `.${moduleName}rc.js`,
          `.${moduleName}rc.cjs`,
          `.config/${moduleName}rc`,
          `.config/${moduleName}rc.json`,
          `.config/${moduleName}rc.js`,
          `.config/${moduleName}rc.cjs`,
          `${moduleName}.config.js`,
          `${moduleName}.config.cjs`,
        ],
        ['config', 'config.json', 'config.js', 'config.cjs'],
      );
    });
  });

  describe('defaults transform to sync identity function', () => {
    const checkResult = (mock: Mock) => {
      const explorerOptions = mock.mock.calls[0][0];
      const x = {};
      expect(explorerOptions.transform(x)).toBe(x);
    };

    test('async', () => {
      cosmiconfig(moduleName);
      checkResult(createExplorerMock);
    });

    test('sync', () => {
      cosmiconfigSync(moduleName);
      checkResult(createExplorerSyncMock);
    });
  });

  describe('creates explorer with preference for given options over defaults', () => {
    const noExtLoader: Loader = () => {};
    const jsLoader: Loader = () => {};
    const tsLoader: Loader = () => {};
    const jsonLoader: Loader = () => {};
    const yamlLoader: Loader = () => {};

    const mjsLoader: Loader = () => {};

    const options = {
      stopDir: __dirname,
      cache: false,
      searchPlaces: ['.config/foo.json'],
      moduleName: 'wildandfree',
      ignoreEmptySearchPlaces: false,
      mergeImportArrays: true,
      mergeSearchPlaces: true,
      loaders: {
        noExt: noExtLoader,
        '.mjs': mjsLoader,
        '.cjs': jsLoader,
        '.js': jsLoader,
        '.ts': tsLoader,
        '.json': jsonLoader,
        '.yaml': yamlLoader,
        '.yml': yamlLoader,
      },
    };

    const expectedLoaderNames = {
      '.mjs': 'mjsLoader',
      '.cjs': 'jsLoader',
      '.js': 'jsLoader',
      '.ts': 'tsLoader',
      '.json': 'jsonLoader',
      '.yaml': 'yamlLoader',
      '.yml': 'yamlLoader',
      noExt: 'noExtLoader',
    };

    const checkResult = (
      mock: SpyInstance,
      instanceNum: number,
      expectedLoaderNames: Record<string, string>,
      expectedGlobalConfigSearchPlaces: Array<string>,
    ) => {
      const instanceIndex = instanceNum - 1;

      expect(mock.mock.calls.length).toBe(instanceNum);
      expect(mock.mock.calls[instanceIndex].length).toBe(1);

      const { transform, loaders, ...explorerOptions } =
        mock.mock.calls[instanceIndex][0];
      expect(transform.name).toMatch(/identity/);
      const loaderFunctionsByName = getLoaderFunctionsByName(loaders);

      // Vitest adds a number suffix to our functions names,
      // so we can't compare them with strict equals
      for (const [key, value] of Object.entries(loaderFunctionsByName)) {
        expect(value).toContain(expectedLoaderNames[key]);
      }

      expect(explorerOptions).toStrictEqual({
        moduleName: 'wildandfree',
        searchPlaces: ['.config/foo.json'],
        globalConfigSearchPlaces: expectedGlobalConfigSearchPlaces,
        ignoreEmptySearchPlaces: false,
        mergeImportArrays: true,
        mergeSearchPlaces: true,
        searchStrategy: 'global',
        stopDir: __dirname,
        cache: false,
        metaConfigFilePath: null,
      });
    };

    test('async', () => {
      cosmiconfig(moduleName, options);
      checkResult(createExplorerMock, 1, expectedLoaderNames, [
        'config',
        'config.json',
        'config.js',
        'config.cjs',
        'config.mjs',
      ]);
    });

    test('sync', () => {
      cosmiconfigSync(moduleName, options);
      checkResult(createExplorerSyncMock, 2, expectedLoaderNames, [
        'config',
        'config.json',
        'config.js',
        'config.cjs',
      ]);
    });
  });

  describe('creates explorer with preference of user options over consumer options', () => {
    const currentDir = process.cwd();

    beforeEach(() => {
      process.chdir(temp.dir);
    });
    afterEach(() => process.chdir(currentDir));

    const noExtLoader: LoaderSync = () => {};
    const jsLoader: LoaderSync = () => {};
    const tsLoader: LoaderSync = () => {};
    const jsonLoader: LoaderSync = () => {};
    const yamlLoader: LoaderSync = () => {};

    const options = {
      stopDir: __dirname,
      cache: false,
      searchPlaces: ['.foorc.json', 'wildandfree.js', '.config/foo.json'],
      moduleName: 'wildandfree',
      ignoreEmptySearchPlaces: false,
      metaConfigFilePath: `${temp.dir}/.config/config.json`,
      loaders: {
        noExt: noExtLoader,
        '.mjs': jsLoader,
        '.cjs': jsLoader,
        '.js': jsLoader,
        '.ts': tsLoader,
        '.json': jsonLoader,
        '.yaml': yamlLoader,
      },
    };

    const checkResultBase = (
      mock: MockInstance,
      instanceNum: number,
      expectedLoaderFunctionNames: any,
    ) => {
      const instanceIndex = instanceNum - 1;

      expect(mock.mock.calls.length).toBe(instanceNum);
      expect(mock.mock.calls[instanceIndex]!.length).toBe(1);
      const { transform, loaders, ...explorerOptions } =
        mock.mock.calls[instanceIndex]![0];

      expect(transform.name).toMatch(/identity/);
      const loaderFunctionsByName = getLoaderFunctionsByName(loaders);

      // Vitest adds a number suffix to our functions names,
      // so we can't compare them with strict equals
      for (const [key, value] of Object.entries(loaderFunctionsByName)) {
        expect(value).toContain(expectedLoaderFunctionNames[key]);
      }

      return explorerOptions;
    };

    describe('merging search places', () => {
      beforeEach(() => {
        temp.createFile(
          '.config/config.json',
          '{"cosmiconfig": {"searchPlaces": [".config/{name}.json"]}}',
        );
      });

      const checkResult = (
        mock: SpyInstance,
        instanceNum: number,
        expectedLoaderFunctionNames: any,
        expectedGlobalConfigSearchPlaces: Array<string>,
      ) => {
        const explorerOptions = checkResultBase(
          mock,
          instanceNum,
          expectedLoaderFunctionNames,
        );
        expect(explorerOptions).toEqual({
          moduleName: 'wildandfree',
          searchPlaces: [
            '.config/foo.json',
            '.foorc.json',
            'wildandfree.js',
            '.config/foo.json',
          ],
          globalConfigSearchPlaces: expectedGlobalConfigSearchPlaces,
          ignoreEmptySearchPlaces: false,
          mergeImportArrays: true,
          mergeSearchPlaces: true,
          searchStrategy: 'global',
          metaConfigFilePath: path.join(temp.dir, '.config/config.json'),
          stopDir: __dirname,
          cache: false,
        });
      };

      test('async', () => {
        cosmiconfig(moduleName, options);
        checkResult(
          createExplorerMock,
          1,
          {
            '.mjs': 'jsLoader',
            '.cjs': 'jsLoader',
            '.js': 'jsLoader',
            '.ts': 'tsLoader',
            '.json': 'jsonLoader',
            '.yaml': 'yamlLoader',
            '.yml': 'loadYaml',
            noExt: 'noExtLoader',
          },
          ['config', 'config.json', 'config.js', 'config.cjs', 'config.mjs'],
        );
      });

      test('sync', () => {
        cosmiconfigSync(moduleName, options);
        checkResult(
          createExplorerSyncMock,
          2, // ExplorerSync is called twice (once in getExplorerOptions)
          {
            '.cjs': 'jsLoader',
            '.mjs': 'jsLoader',
            '.js': 'jsLoader',
            '.ts': 'tsLoader',
            '.json': 'jsonLoader',
            '.yaml': 'yamlLoader',
            '.yml': 'loadYaml',
            noExt: 'noExtLoader',
          },
          ['config', 'config.json', 'config.js', 'config.cjs'],
        );
      });
    });

    describe('not merging search places', () => {
      beforeEach(() => {
        temp.createFile(
          '.config/config.json',
          '{"cosmiconfig": {"searchPlaces": [".config/{name}.json"], "mergeSearchPlaces": false}}',
        );
      });

      const checkResult = (
        mock: SpyInstance,
        instanceNum: number,
        expectedLoaderFunctionNames: any,
        expectedGlobalConfigSearchPlaces: Array<string>,
      ) => {
        const explorerOptions = checkResultBase(
          mock,
          instanceNum,
          expectedLoaderFunctionNames,
        );

        expect(explorerOptions).toEqual({
          moduleName: 'wildandfree',
          searchPlaces: ['.config/foo.json'],
          globalConfigSearchPlaces: expectedGlobalConfigSearchPlaces,
          ignoreEmptySearchPlaces: false,
          mergeImportArrays: true,
          mergeSearchPlaces: false,
          searchStrategy: 'global',
          metaConfigFilePath: path.join(temp.dir, '.config/config.json'),
          stopDir: __dirname,
          cache: false,
        });
      };

      test('async', () => {
        cosmiconfig(moduleName, options);
        checkResult(
          createExplorerMock,
          1,
          {
            '.mjs': 'jsLoader',
            '.cjs': 'jsLoader',
            '.js': 'jsLoader',
            '.ts': 'tsLoader',
            '.json': 'jsonLoader',
            '.yaml': 'yamlLoader',
            '.yml': 'loadYaml',
            noExt: 'noExtLoader',
          },
          ['config', 'config.json', 'config.js', 'config.cjs', 'config.mjs'],
        );
      });

      test('sync', () => {
        cosmiconfigSync(moduleName, options);
        checkResult(
          createExplorerSyncMock,
          2, // ExplorerSync is called twice (once in getExplorerOptions)
          {
            '.cjs': 'jsLoader',
            '.mjs': 'jsLoader',
            '.js': 'jsLoader',
            '.ts': 'tsLoader',
            '.json': 'jsonLoader',
            '.yaml': 'yamlLoader',
            '.yml': 'loadYaml',
            noExt: 'noExtLoader',
          },
          ['config', 'config.json', 'config.js', 'config.cjs'],
        );
      });
    });
  });

  describe('errors if loader is not passed a function', () => {
    beforeEach(() => {
      temp.createFile(
        'a/b/c/d/e/f/.foorc.things',
        'one\ntwo\nthree\t\t\n  four\n',
      );
    });

    const explorerOptions = {
      stopDir: temp.absolutePath('.'),
      searchPlaces: ['.foorc.things'],
      loaders: {
        '.things': 1,
      },
    };

    const expectedError =
      'Loader for extension ".foorc.things" is not a function: Received number.';

    test('async', () => {
      expect(() =>
        cosmiconfig('foo', explorerOptions as unknown as Partial<Options>),
      ).toThrow(expectedError);
    });

    test('sync', () => {
      expect(() =>
        cosmiconfigSync(
          'foo',
          explorerOptions as unknown as Partial<OptionsSync>,
        ),
      ).toThrow(expectedError);
    });
  });

  test('errors with invalid combination of searchStrategy and stopDir', () => {
    expect(() =>
      cosmiconfig('foo', {
        searchStrategy: 'none',
        stopDir: 'a',
      }),
    ).toThrow(
      'Can not supply `stopDir` option with `searchStrategy` other than "global"',
    );
  });

  test('cannot mutate default loaders', () => {
    const expectedError = "Cannot delete property '.js' of #<Object>";
    // @ts-ignore
    expect(() => delete defaultLoaders['.js']).toThrow(expectedError);
  });
});
