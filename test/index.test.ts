/* eslint-disable @typescript-eslint/no-extraneous-class,@typescript-eslint/explicit-member-accessibility */
import { TempDir } from './util';
import {
  cosmiconfig as cosmiconfigModule,
  cosmiconfigSync as cosmiconfigSyncModule,
  LoaderSync,
} from '../src';

const temp = new TempDir();

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
    const checkResult = (mock: jest.SpyInstance) => {
      expect(mock).toHaveBeenCalledTimes(1);
      const explorerOptions = mock.mock.calls[0][0];
      expect(explorerOptions).toMatchInlineSnapshot(`
        Object {
          "cache": true,
          "ignoreEmptySearchPlaces": true,
          "loaders": Object {
            ".js": [Function loadJs],
            ".json": [Function loadJson],
            ".yaml": [Function loadYaml],
            ".yml": [Function loadYaml],
            "noExt": [Function loadYaml],
          },
          "packageProp": "foo",
          "searchPlaces": Array [
            "package.json",
            ".foorc",
            ".foorc.json",
            ".foorc.yaml",
            ".foorc.yml",
            ".foorc.js",
            "foo.config.js",
          ],
          "stopDir": "<HOME_DIR>",
          "transform": [Function identity],
        }
      `);
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
      loaders: {
        noExt: noExtLoader,
        '.js': jsLoader,
        '.json': jsonLoader,
        '.yaml': yamlLoader,
      },
    };

    const checkResult = (mock: jest.SpyInstance) => {
      const explorerOptions = mock.mock.calls[0][0];
      expect(explorerOptions).toMatchInlineSnapshot(`
        Object {
          "cache": false,
          "ignoreEmptySearchPlaces": false,
          "loaders": Object {
            ".js": [Function jsLoader],
            ".json": [Function jsonLoader],
            ".yaml": [Function yamlLoader],
            ".yml": [Function loadYaml],
            "noExt": [Function noExtLoader],
          },
          "packageProp": "wildandfree",
          "searchPlaces": Array [
            ".foorc.json",
            "wildandfree.js",
          ],
          "stopDir": "<PROJECT_ROOT>/test",
          "transform": [Function identity],
        }
      `);
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
