'use strict';

const path = require('path');
const prettier = require('prettier');
const runPrettier = require('prettier/tests_integration/runPrettier');
const cases = require('jest-in-case');

const fixturesDir = path.join(__dirname, 'fixtures');
const getDir = name => path.join(fixturesDir, `${name}-conf`);

const rcDir = getDir('rc-json');
const pkgDir = getDir('pkg');
const jsDir = getDir('js');
const noConfDir = getDir('no');

describe('prettier', () => {
  test('resolves configuration from external files', () => {
    const output = runPrettier(fixturesDir, ['**/*.js']);
    expect(output.stdout).toMatchSnapshot();
    expect(output.status).toEqual(0);
  });

  cases(
    'accepts configuration from --config',
    opts => {
      const output = runPrettier(fixturesDir, [
        '--config',
        opts.configPath,
        opts.file,
      ]);
      expect(output.stdout).toMatchSnapshot();
      expect(output.status).toEqual(0);
    },
    [
      {
        name: '.prettierrc',
        configPath: 'rc-json-conf/.prettierrc',
        file: 'js-conf/file.js',
      },
      {
        name: 'package.json',
        configPath: 'pkg-conf/package.json',
        file: 'js-conf/file.js',
        skip: true, // Waiting for davidtheclark/cosmiconfig#81
      },
      {
        name: 'prettier.config.js',
        configPath: 'js-conf/prettier.config.js',
        file: 'pkg-conf/file.js',
      },
    ]
  );

  it('resolves configuration file with --find-config-path file', () => {
    const output = runPrettier(fixturesDir, [
      '--find-config-path',
      'no-conf/file.js',
    ]);
    expect(output.stdout).toMatchSnapshot();
    expect(output.status).toEqual(0);
  });

  it('returns null for resolveConfig with no args', () => {
    return prettier.resolveConfig().then(result => {
      expect(result).toBeNull();
    });
  });

  cases(
    'resolves config from given dir',
    opts => {
      expect.assertions(1);
      return expect(prettier.resolveConfig(opts.dir)).resolves.toEqual(
        opts.conf
      );
    },
    [
      {
        name: '.prettierrc',
        dir: rcDir,
        conf: { trailingComma: 'all', singleQuote: true },
      },
      { name: 'package.json', dir: pkgDir, conf: { tabWidth: 3 } },
      { name: 'prettier.config.js', dir: jsDir, conf: { tabWidth: 8 } },
      { name: 'no config', dir: noConfDir, conf: { semi: false } },
    ]
  );

  it('resolves config for given file', () => {
    expect.assertions(1);
    return expect(
      prettier.resolveConfig(path.join(jsDir, 'file.js'))
    ).resolves.toEqual({ tabWidth: 8 });
  });
});
