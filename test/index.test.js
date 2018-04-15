'use strict';

// Mock `createExplorer` because we want to check what it is called with.
jest.mock('../src/createExplorer');

const os = require('os');
const cosmiconfig = require('../src');
const util = require('./util');
const createExplorerMock = require('../src/createExplorer');

const temp = new util.TempDir();

describe('cosmiconfig', () => {
  const moduleName = 'foo';
  const stopDir = os.homedir();

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
    expect(createExplorerMock).toHaveBeenCalledWith({
      moduleName,
      packageProp: moduleName,
      rc: `.${moduleName}rc`,
      js: `${moduleName}.config.js`,
      rcStrictJson: false,
      rcExtensions: false,
      stopDir,
      cache: true,
    });
  });

  it('creates explorer with preference for given options over defaults', () => {
    temp.createFile('foo.json', '{ "foo": true }');

    const configPath = temp.absolutePath('foo.json');
    cosmiconfig(moduleName, {
      moduleName,
      rc: `.${moduleName}barrc`,
      js: `${moduleName}bar.config.js`,
      rcStrictJson: true,
      rcExtensions: true,
      stopDir: __dirname,
      cache: false,
      configPath,
    });

    expect(createExplorerMock).toHaveBeenCalledWith({
      moduleName,
      packageProp: moduleName,
      rc: `.${moduleName}barrc`,
      js: `${moduleName}bar.config.js`,
      rcStrictJson: true,
      rcExtensions: true,
      stopDir: __dirname,
      cache: false,
      configPath,
    });
  });
});
