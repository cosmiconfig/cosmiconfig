'use strict';

// Mock `createExplorer` because we want to check what it is called with.
jest.mock('../src/createExplorer');
// Mock `minimist` and also provide default implementation which returns an
// empty object. The factory function returns a mock which we can tweak per
// test basis.
jest.mock('minimist', () => jest.fn(() => ({})));

const os = require('os');
const path = require('path');
const cosmiconfig = require('../src/index');

const minimistMock = require('minimist');
const createExplorerMock = require('../src/createExplorer');

describe('cosmiconfig', () => {
  const moduleName = 'foo';
  const stopDir = os.homedir();
  const configPath = path.join(__dirname, 'fixtures/foo.json');

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
      argv: 'config',
      rcStrictJson: false,
      stopDir,
      cache: true,
      sync: false,
    });
  });

  it('creates explorer with preference for given options over defaults', () => {
    cosmiconfig(moduleName, {
      rc: `.${moduleName}barrc`,
      js: `${moduleName}bar.config.js`,
      argv: false,
      rcStrictJson: true,
      stopDir: __dirname,
      cache: false,
      sync: true,
    });

    expect(createExplorerMock).toHaveBeenCalledWith({
      packageProp: moduleName,
      rc: `.${moduleName}barrc`,
      js: `${moduleName}bar.config.js`,
      argv: false,
      rcStrictJson: true,
      stopDir: __dirname,
      cache: false,
      sync: true,
    });
  });

  it('uses the --config flag by default', () => {
    minimistMock.mockReturnValueOnce({ config: configPath });
    cosmiconfig(moduleName);

    expect(createExplorerMock).toHaveBeenCalledWith({
      packageProp: moduleName,
      rc: `.${moduleName}rc`,
      js: `${moduleName}.config.js`,
      argv: 'config',
      rcStrictJson: false,
      stopDir,
      cache: true,
      sync: false,
      configPath,
    });
  });

  it('does not use the --config flag if options.argv is false', () => {
    minimistMock.mockReturnValueOnce({ config: configPath });
    cosmiconfig(moduleName, { argv: false });

    expect(createExplorerMock).toHaveBeenCalledWith({
      packageProp: moduleName,
      rc: `.${moduleName}rc`,
      js: `${moduleName}.config.js`,
      argv: false,
      rcStrictJson: false,
      stopDir,
      cache: true,
      sync: false,
    });
  });

  it('uses the argv name specified by options for reading configPath', () => {
    minimistMock.mockReturnValueOnce({ 'foo-config': configPath });
    cosmiconfig(moduleName, { argv: 'foo-config' });

    expect(createExplorerMock).toHaveBeenCalledWith({
      packageProp: moduleName,
      rc: `.${moduleName}rc`,
      js: `${moduleName}.config.js`,
      argv: 'foo-config',
      rcStrictJson: false,
      stopDir,
      cache: true,
      sync: false,
      configPath,
    });
  });
});
