/* eslint-disable @typescript-eslint/no-extraneous-class,@typescript-eslint/explicit-member-accessibility,@typescript-eslint/no-empty-function*/
import {
  Explorer,
  ExplorerSync,
  InternalOptions,
  InternalOptionsSync,
  Options,
} from '@cosmiconfig/base';
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
  defaultLoaders,
  Loader,
  Loaders,
  LoaderSync,
  OptionsSync,
} from '../src';
import { TempDir } from './util';

vi.mock('@cosmiconfig/base', async () => {
  const { ExplorerSync, Explorer, ...rest } =
    await vi.importActual<typeof import('@cosmiconfig/base')>(
      '@cosmiconfig/base',
    );

  const mock = vi.fn();
  const mockSync = vi.fn();

  return {
    ...rest,
    Explorer: class FakeExplorer extends Explorer {
      static mock = mock;
      constructor(options: InternalOptions) {
        mock(options);
        super(options);
      }
    },
    ExplorerSync: class FakeExplorerSync extends ExplorerSync {
      static mock = mockSync;
      constructor(options: InternalOptionsSync) {
        mockSync(options);
        super(options);
      }
    },
  };

  return {};
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

const checkConfigResult = (
  mock: SpyInstance,
  instanceNum: number,
  expectedLoaderNames: Record<string, string>,
  expectedExplorerOptions: Omit<
    InternalOptions & InternalOptionsSync,
    'transform' | 'loaders'
  >,
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

  expect(explorerOptions).toStrictEqual(expectedExplorerOptions);
};

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
          '.ts': 'loadTs',
          '.json': 'loadJson',
          '.yaml': 'loadYaml',
          '.yml': 'loadYaml',
          noExt: 'loadYaml',
        },
        [
          'package.json',
          `.${moduleName}rc`,
          `.${moduleName}rc.json`,
          `.${moduleName}rc.yaml`,
          `.${moduleName}rc.yml`,
          `.${moduleName}rc.js`,
          `.${moduleName}rc.ts`,
          `.${moduleName}rc.cjs`,
          `.${moduleName}rc.mjs`,
          `.config/${moduleName}rc`,
          `.config/${moduleName}rc.json`,
          `.config/${moduleName}rc.yaml`,
          `.config/${moduleName}rc.yml`,
          `.config/${moduleName}rc.js`,
          `.config/${moduleName}rc.ts`,
          `.config/${moduleName}rc.cjs`,
          `.config/${moduleName}rc.mjs`,
          `${moduleName}.config.js`,
          `${moduleName}.config.ts`,
          `${moduleName}.config.cjs`,
          `${moduleName}.config.mjs`,
        ],
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
          '.ts': 'loadTsSync',
          '.json': 'loadJson',
          '.yaml': 'loadYaml',
          '.yml': 'loadYaml',
          noExt: 'loadYaml',
        },
        [
          'package.json',
          `.${moduleName}rc`,
          `.${moduleName}rc.json`,
          `.${moduleName}rc.yaml`,
          `.${moduleName}rc.yml`,
          `.${moduleName}rc.js`,
          `.${moduleName}rc.ts`,
          `.${moduleName}rc.cjs`,
          `.config/${moduleName}rc`,
          `.config/${moduleName}rc.json`,
          `.config/${moduleName}rc.yaml`,
          `.config/${moduleName}rc.yml`,
          `.config/${moduleName}rc.js`,
          `.config/${moduleName}rc.ts`,
          `.config/${moduleName}rc.cjs`,
          `${moduleName}.config.js`,
          `${moduleName}.config.ts`,
          `${moduleName}.config.cjs`,
        ],
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

    const expectedExplorerOptions = {
      moduleName: 'wildandfree',
      searchPlaces: ['.config/foo.json'],
      ignoreEmptySearchPlaces: false,
      mergeImportArrays: true,
      mergeSearchPlaces: true,
      searchStrategy: 'global',
      stopDir: __dirname,
      cache: false,
      metaConfigFilePath: null,
    } satisfies Partial<InternalOptions | InternalOptionsSync>;

    test('async', () => {
      cosmiconfig(moduleName, options);
      checkConfigResult(
        createExplorerMock,
        1,
        expectedLoaderNames,
        expectedExplorerOptions,
      );
    });

    test('sync', () => {
      cosmiconfigSync(moduleName, options);
      checkConfigResult(
        createExplorerSyncMock,
        2,
        expectedLoaderNames,
        expectedExplorerOptions,
      );
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
        checkResult(createExplorerMock, 1, {
          '.mjs': 'jsLoader',
          '.cjs': 'jsLoader',
          '.js': 'jsLoader',
          '.ts': 'tsLoader',
          '.json': 'jsonLoader',
          '.yaml': 'yamlLoader',
          '.yml': 'loadYaml',
          noExt: 'noExtLoader',
        });
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
      ) => {
        const explorerOptions = checkResultBase(
          mock,
          instanceNum,
          expectedLoaderFunctionNames,
        );

        expect(explorerOptions).toEqual({
          moduleName: 'wildandfree',
          searchPlaces: ['.config/foo.json'],
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
        checkResult(createExplorerMock, 1, {
          '.mjs': 'jsLoader',
          '.cjs': 'jsLoader',
          '.js': 'jsLoader',
          '.ts': 'tsLoader',
          '.json': 'jsonLoader',
          '.yaml': 'yamlLoader',
          '.yml': 'loadYaml',
          noExt: 'noExtLoader',
        });
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
