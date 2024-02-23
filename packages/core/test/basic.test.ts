/* eslint-disable @typescript-eslint/no-extraneous-class,@typescript-eslint/explicit-member-accessibility,@typescript-eslint/no-empty-function*/
import {
  Loader,
  LoaderSync,
  Loaders,
  Options,
  OptionsSync,
} from '@cosmiconfig/types';
import path from 'path';
import {
  Mock,
  MockInstance,
  SpyInstance,
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { Explorer } from '../src/Explorer';
import { ExplorerSync } from '../src/ExplorerSync';
import {
  cosmiconfigBasic,
  cosmiconfigBasicSync,
  defaultLoaders,
} from '../src/basic';
import { InternalOptions, InternalOptionsSync } from '../src/types';
import { TempDir } from './util';

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

describe('cosmiconfigBasic', () => {
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
      cosmiconfigBasic(moduleName);
      checkResult(
        createExplorerMock,
        1,
        {
          '.json': 'loadJson',
          noExt: 'loadJson',
        },
        [
          'package.json',
          `.${moduleName}rc`,
          `.${moduleName}rc.json`,
          `.config/${moduleName}rc`,
          `.config/${moduleName}rc.json`,
        ],
        ['config', 'config.json'],
      );
    });

    test('sync', () => {
      cosmiconfigBasicSync(moduleName);
      checkResult(
        createExplorerSyncMock,
        2, // ExplorerSync is called twice (once in getExplorerOptions)
        {
          '.json': 'loadJson',
          noExt: 'loadJson',
        },
        [
          'package.json',
          `.${moduleName}rc`,
          `.${moduleName}rc.json`,
          `.config/${moduleName}rc`,
          `.config/${moduleName}rc.json`,
        ],
        ['config', 'config.json'],
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
      cosmiconfigBasic(moduleName);
      checkResult(createExplorerMock);
    });

    test('sync', () => {
      cosmiconfigBasicSync(moduleName);
      checkResult(createExplorerSyncMock);
    });
  });

  describe('creates explorer with preference for given options over defaults', () => {
    const noExtLoader: Loader = () => {};
    const jsonLoader: Loader = () => {};

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
        '.json': jsonLoader,
      },
    };

    const expectedLoaderNames = {
      '.json': 'jsonLoader',
      noExt: 'noExtLoader',
    };

    const expectedExplorerOptions = (
      expectedGlobalConfigSearchPlaces: Array<string>,
    ) =>
      ({
        moduleName: 'wildandfree',
        globalConfigSearchPlaces: expectedGlobalConfigSearchPlaces,
        searchPlaces: ['.config/foo.json'],
        ignoreEmptySearchPlaces: false,
        mergeImportArrays: true,
        mergeSearchPlaces: true,
        searchStrategy: 'global',
        stopDir: __dirname,
        cache: false,
        metaConfigFilePath: null,
      }) satisfies Partial<InternalOptions | InternalOptionsSync>;

    test('async', () => {
      cosmiconfigBasic(moduleName, options);
      checkConfigResult(
        createExplorerMock,
        1,
        expectedLoaderNames,
        expectedExplorerOptions(['config', 'config.json']),
      );
    });

    test('sync', () => {
      cosmiconfigBasicSync(moduleName, options);
      checkConfigResult(
        createExplorerSyncMock,
        2,
        expectedLoaderNames,
        expectedExplorerOptions(['config', 'config.json']),
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
    const jsonLoader: LoaderSync = () => {};

    const options = {
      stopDir: __dirname,
      cache: false,
      searchPlaces: ['.foorc.json', '.config/foo.json'],
      moduleName: 'wildandfree',
      ignoreEmptySearchPlaces: false,
      metaConfigFilePath: `${temp.dir}/.config/config.json`,
      loaders: {
        noExt: noExtLoader,
        '.json': jsonLoader,
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
          globalConfigSearchPlaces: expectedGlobalConfigSearchPlaces,
          searchPlaces: ['.config/foo.json', '.foorc.json', '.config/foo.json'],
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
        cosmiconfigBasic(moduleName, options);
        checkResult(
          createExplorerMock,
          1,
          {
            '.json': 'jsonLoader',
            noExt: 'noExtLoader',
          },
          ['config', 'config.json'],
        );
      });

      test('sync', () => {
        cosmiconfigBasicSync(moduleName, options);
        checkResult(
          createExplorerSyncMock,
          2, // ExplorerSync is called twice (once in getExplorerOptions)
          {
            '.json': 'jsonLoader',
            noExt: 'noExtLoader',
          },
          ['config', 'config.json'],
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
        cosmiconfigBasic(moduleName, options);
        checkResult(
          createExplorerMock,
          1,
          {
            '.json': 'jsonLoader',
            noExt: 'noExtLoader',
          },
          ['config', 'config.json'],
        );
      });

      test('sync', () => {
        cosmiconfigBasicSync(moduleName, options);
        checkResult(
          createExplorerSyncMock,
          2, // ExplorerSync is called twice (once in getExplorerOptions)
          {
            '.json': 'jsonLoader',
            noExt: 'noExtLoader',
          },
          ['config', 'config.json'],
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
        cosmiconfigBasic('foo', explorerOptions as unknown as Partial<Options>),
      ).toThrow(expectedError);
    });

    test('sync', () => {
      expect(() =>
        cosmiconfigBasicSync(
          'foo',
          explorerOptions as unknown as Partial<OptionsSync>,
        ),
      ).toThrow(expectedError);
    });
  });

  test('errors with invalid combination of searchStrategy and stopDir', () => {
    expect(() =>
      cosmiconfigBasic('foo', {
        searchStrategy: 'none',
        stopDir: 'a',
      }),
    ).toThrow(
      'Can not supply `stopDir` option with `searchStrategy` other than "global"',
    );
  });

  test('cannot mutate default loaders', () => {
    const expectedError = "Cannot delete property '.json' of #<Object>";
    // @ts-ignore
    expect(() => delete defaultLoaders['.json']).toThrow(expectedError);
  });
});
