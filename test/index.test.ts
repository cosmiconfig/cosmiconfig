/* eslint-disable @typescript-eslint/no-extraneous-class,@typescript-eslint/explicit-member-accessibility,@typescript-eslint/no-empty-function */
import os from 'os';
import {
  cosmiconfig as cosmiconfigModule,
  cosmiconfigSync as cosmiconfigSyncModule,
  defaultLoaders,
  LoaderSync,
} from '../src';
import { ExplorerOptions, ExplorerOptionsSync, Loaders } from '../src/types';
import { TempDir } from './util';

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
  mock: jest.SpyInstance,
  instanceNum: number,
  expectedLoaderNames: Record<string, string>,
  expectedExplorerOptions: Omit<
    ExplorerOptions & ExplorerOptionsSync,
    'transform' | 'loaders'
  >,
) => {
  const instanceIndex = instanceNum - 1;
  expect(mock.mock.calls.length).toEqual(instanceNum);
  expect(mock.mock.calls[instanceIndex].length).toEqual(1);

  const { transform, loaders, ...explorerOptions } =
    mock.mock.calls[instanceIndex][0];
  expect(transform.name).toBe('identity');
  const loaderFunctionsByName = getLoaderFunctionsByName(loaders);
  expect(loaderFunctionsByName).toEqual(expectedLoaderNames);
  expect(explorerOptions).toEqual(expectedExplorerOptions);
};

let cosmiconfig: typeof cosmiconfigModule;
let cosmiconfigSync: typeof cosmiconfigSyncModule;
let createExplorerMock: jest.SpyInstance & typeof cosmiconfigModule;
let createExplorerSyncMock: jest.SpyInstance & typeof cosmiconfigSyncModule;
describe('cosmiconfig', () => {
  const moduleName = 'foo';

  beforeEach(() => {
    temp.clean();

    createExplorerMock = jest.fn();
    jest.doMock('../src/Explorer', () => {
      return {
        Explorer: class FakeExplorer {
          constructor(options: Parameters<typeof cosmiconfigModule>[0]) {
            createExplorerMock(options);
            const { Explorer } = jest.requireActual('../src/Explorer');

            return new Explorer(options);
          }
        },
      };
    });

    createExplorerSyncMock = jest.fn();
    jest.doMock('../src/ExplorerSync', () => {
      return {
        ExplorerSync: class FakeExplorerSync {
          constructor(options: Parameters<typeof cosmiconfigSyncModule>[0]) {
            createExplorerSyncMock(options);
            const { ExplorerSync } = jest.requireActual('../src/ExplorerSync');

            return new ExplorerSync(options);
          }
        },
      };
    });

    const index = require('../src/index');
    cosmiconfig = index.cosmiconfig;
    cosmiconfigSync = index.cosmiconfigSync;
  });

  afterAll(() => {
    // Remove temp.dir created for tests
    temp.deleteTempDir();
  });

  describe('creates explorer with default options if not specified', () => {
    const expectedLoaderNames = {
      '.cjs': 'loadJs',
      '.js': 'loadJs',
      '.json': 'loadJson',
      '.yaml': 'loadYaml',
      '.yml': 'loadYaml',
      noExt: 'loadYaml',
    };

    const expectedExplorerOptions = {
      packageProp: moduleName,
      searchPlaces: [
        'package.json',
        `.${moduleName}rc`,
        `.${moduleName}rc.json`,
        `.${moduleName}rc.yaml`,
        `.${moduleName}rc.yml`,
        `.${moduleName}rc.js`,
        `.${moduleName}rc.cjs`,
        `.config/${moduleName}rc`,
        `.config/${moduleName}rc.json`,
        `.config/${moduleName}rc.yaml`,
        `.config/${moduleName}rc.yml`,
        `.config/${moduleName}rc.js`,
        `.config/${moduleName}rc.cjs`,
        `${moduleName}.config.js`,
        `${moduleName}.config.cjs`,
      ],
      ignoreEmptySearchPlaces: true,
      mergeImportArrays: true,
      stopDir: os.homedir(),
      cache: true,
      metaConfigFilePath: null,
    };

    test('async', () => {
      cosmiconfig(moduleName);
      checkConfigResult(
        createExplorerMock,
        1,
        expectedLoaderNames,
        expectedExplorerOptions,
      );
    });

    test('sync', () => {
      cosmiconfigSync(moduleName);
      checkConfigResult(
        createExplorerSyncMock,
        2,
        expectedLoaderNames,
        expectedExplorerOptions,
      );
    });
  });

  describe('defaults transform to sync identity function', () => {
    const checkResult = (mock: jest.SpyInstance) => {
      const explorerOptions = mock.mock.calls[0][0];
      const x = {};
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
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
    beforeEach(() => {
      temp.createFile('foo.json', '{ "foo": true }');
    });

    const noExtLoader: LoaderSync = () => {};
    const jsLoader: LoaderSync = () => {};
    const jsonLoader: LoaderSync = () => {};
    const yamlLoader: LoaderSync = () => {};

    const options = {
      stopDir: __dirname,
      cache: false,
      searchPlaces: ['.foorc.json', 'wildandfree.js'],
      packageProp: 'wildandfree',
      ignoreEmptySearchPlaces: false,
      mergeImportArrays: true,
      loaders: {
        noExt: noExtLoader,
        '.cjs': jsLoader,
        '.js': jsLoader,
        '.json': jsonLoader,
        '.yaml': yamlLoader,
      },
    };

    const expectedLoaderNames = {
      '.cjs': 'jsLoader',
      '.js': 'jsLoader',
      '.json': 'jsonLoader',
      '.yaml': 'yamlLoader',
      '.yml': 'loadYaml',
      noExt: 'noExtLoader',
    };

    const expectedExplorerOptions = {
      packageProp: 'wildandfree',
      searchPlaces: ['.foorc.json', 'wildandfree.js'],
      ignoreEmptySearchPlaces: false,
      mergeImportArrays: true,
      stopDir: __dirname,
      cache: false,
      metaConfigFilePath: null,
    };

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
      'loader for extension ".things" is not a function (type provided: "number"), so searchPlaces item ".foorc.things" is invalid';
    test('async', () => {
      expect(() =>
        // @ts-ignore
        cosmiconfig('foo', explorerOptions),
      ).toThrow(expectedError);
    });

    test('sync', () => {
      expect(() =>
        // @ts-ignore
        cosmiconfigSync('foo', explorerOptions),
      ).toThrow(expectedError);
    });
  });

  test('cannot mutate default loaders', () => {
    const expectedError = "Cannot delete property '.js' of #<Object>";
    // @ts-ignore
    expect(() => delete defaultLoaders['.js']).toThrow(expectedError);
  });
});
