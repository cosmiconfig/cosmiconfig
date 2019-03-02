'use strict';

// Mock `createExplorer` because we want to check what it is called with.
jest.mock('../src/createExplorer');

import os = require('os');
import cosmiconfig = require('../src');
import util = require('./util');
const createExplorerMock: typeof import('../src/createExplorer') & {mock: any} = require('../src/createExplorer');
import loaders = require('../src/loaders');

const temp = new util.TempDir();

describe('cosmiconfig', () => {
  const moduleName = 'foo';

  beforeEach(() => {
    temp.clean();
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

  it('creates explorer with default options if not specified', () => {
    cosmiconfig(moduleName);

    expect(createExplorerMock).toHaveBeenCalledTimes(1);
    const explorerOptions = createExplorerMock.mock.calls[0][0];
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
        '.js': { sync: loaders.loadJs, async: loaders.loadJs },
        '.json': { sync: loaders.loadJson, async: loaders.loadJson },
        '.yaml': { sync: loaders.loadYaml, async: loaders.loadYaml },
        '.yml': { sync: loaders.loadYaml, async: loaders.loadYaml },
        noExt: { sync: loaders.loadYaml, async: loaders.loadYaml },
      },
      transform: expect.any(Function),
    });
  });

  it('defaults transform to identity function', () => {
    cosmiconfig(moduleName);
    const explorerOptions = createExplorerMock.mock.calls[0][0];

    const x = {};
    expect(explorerOptions.transform(x)).toBe(x);
  });

  it('creates explorer with preference for given options over defaults', () => {
    temp.createFile('foo.json', '{ "foo": true }');

    const noExtLoader = () => {};
    const jsLoader = () => {};
    const jsonLoader = () => {};
    const yamlLoader = () => {};

    cosmiconfig(moduleName, {
      stopDir: __dirname,
      cache: false,
      searchPlaces: ['.foorc.json', 'wildandfree.js'],
      packageProp: 'wildandfree',
      ignoreEmptySearchPlaces: false,
      loaders: {
        noExt: noExtLoader,
        '.js': { async: jsLoader },
        '.json': { sync: jsonLoader },
        '.yaml': { sync: yamlLoader, async: yamlLoader },
      },
    });

    const explorerOptions = createExplorerMock.mock.calls[0][0];
    expect(explorerOptions).toMatchObject({
      packageProp: 'wildandfree',
      searchPlaces: ['.foorc.json', 'wildandfree.js'],
      ignoreEmptySearchPlaces: false,
      stopDir: __dirname,
      cache: false,
      loaders: {
        '.js': { async: jsLoader },
        '.json': { sync: jsonLoader },
        '.yaml': { sync: yamlLoader, async: yamlLoader },
        '.yml': { sync: loaders.loadYaml, async: loaders.loadYaml },
        noExt: { sync: noExtLoader, async: noExtLoader },
      },
      transform: expect.any(Function),
    });
  });
});
