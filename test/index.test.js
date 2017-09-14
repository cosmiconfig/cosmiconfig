'use strict';

// Mock `createExplorer` because we want to check what it is called with.
jest.mock('../src/createExplorer');

const os = require('os');
const path = require('path');
const cosmiconfig = require('../src');

const createExplorerMock = require('../src/createExplorer');

describe('cosmiconfig', () => {
  const moduleName = 'foo';
  const stopDir = os.homedir();

  afterEach(() => {
    // Clean up a mock's usage data between tests
    jest.clearAllMocks();
  });

  it('creates explorer with default options if not specified', () => {
    cosmiconfig(moduleName);

    expect(createExplorerMock).toHaveBeenCalledTimes(1);
    expect(createExplorerMock).toHaveBeenCalledWith({
      packageProp: moduleName,
      rc: `.${moduleName}rc`,
      js: `${moduleName}.config.js`,
      rcStrictJson: false,
      stopDir,
      cache: true,
      sync: false,
    });
  });

  it('creates explorer with preference for given options over defaults', () => {
    const configPath = path.join(__dirname, 'fixtures/foo.json');
    cosmiconfig(moduleName, {
      rc: `.${moduleName}barrc`,
      js: `${moduleName}bar.config.js`,
      rcStrictJson: true,
      stopDir: __dirname,
      cache: false,
      sync: true,
      configPath,
    });

    expect(createExplorerMock).toHaveBeenCalledWith({
      packageProp: moduleName,
      rc: `.${moduleName}barrc`,
      js: `${moduleName}bar.config.js`,
      rcStrictJson: true,
      stopDir: __dirname,
      cache: false,
      sync: true,
      configPath,
    });
  });
});
