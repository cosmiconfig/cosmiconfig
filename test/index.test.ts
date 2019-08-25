import os from 'os';
import { TempDir } from './util';
import { LoaderSync } from '../src';
import * as createExplorer from '../src/createExplorer';
import * as createExplorerSync from '../src/createExplorerSync';
import { loaders } from '../src/loaders';

let createExplorerMock = jest.spyOn(createExplorer, 'createExplorer');
let createExplorerSyncMock = jest.spyOn(
  createExplorerSync,
  'createExplorerSync',
);

const { cosmiconfig, cosmiconfigSync } = require('../src');

const temp = new TempDir();

describe('cosmiconfig', () => {
  const moduleName = 'foo';

  beforeEach(() => {
    temp.clean();
    createExplorerMock = jest.spyOn(createExplorer, 'createExplorer');
    createExplorerSyncMock = jest.spyOn(
      createExplorerSync,
      'createExplorerSync',
    );
  });

  afterEach(() => {
    // Clean up a mock's usage data between tests
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    // Remove temp.dir created for tests
    temp.deleteTempDir();
  });

  describe('creates explorer with default options if not specified', () => {
    const checkResult = (
      mock: typeof createExplorerMock | typeof createExplorerSyncMock,
    ) => {
      expect(mock).toHaveBeenCalledTimes(1);
      const explorerOptions = mock.mock.calls[0][0];
      expect(explorerOptions).toMatchObject({
        packageProp: moduleName,
        searchPlaces: [
          'package.json',
          `.${moduleName}rc`,
          `.${moduleName}rc.json`,
          `.${moduleName}rc.yaml`,
          `.${moduleName}rc.yml`,
          `.${moduleName}rc.js`,
          `${moduleName}.config.js`,
        ],
        ignoreEmptySearchPlaces: true,
        stopDir: os.homedir(),
        cache: true,
        loaders: {
          '.js': loaders.loadJs,
          '.json': loaders.loadJson,
          '.yaml': loaders.loadYaml,
          '.yml': loaders.loadYaml,
          noExt: loaders.loadYaml,
        },
        transform: expect.any(Function),
      });
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

  describe('defaults transform to sync identity function', () => {
    const checkResult = (
      mock: typeof createExplorerMock | typeof createExplorerSyncMock,
    ) => {
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
      loaders: {
        noExt: noExtLoader,
        '.js': jsLoader,
        '.json': jsonLoader,
        '.yaml': yamlLoader,
      },
    };

    const checkResult = (
      mock: typeof createExplorerMock | typeof createExplorerSyncMock,
    ) => {
      const explorerOptions = mock.mock.calls[0][0];
      expect(explorerOptions).toMatchObject({
        packageProp: 'wildandfree',
        searchPlaces: ['.foorc.json', 'wildandfree.js'],
        ignoreEmptySearchPlaces: false,
        stopDir: __dirname,
        cache: false,
        loaders: {
          '.js': jsLoader,
          '.json': jsonLoader,
          '.yaml': yamlLoader,
          '.yml': loaders.loadYaml,
          noExt: noExtLoader,
        },
        transform: expect.any(Function),
      });
    };

    test('async', () => {
      cosmiconfig(moduleName, options);
      checkResult(createExplorerMock);
    });

    test('sync', () => {
      cosmiconfigSync(moduleName, options);
      checkResult(createExplorerSyncMock);
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
    test('async', async () => {
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
});
