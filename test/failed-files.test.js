'use strict';

const util = require('./util');
const cosmiconfig = require('..');

const configFileLoader = util.configFileLoader;

function makeSyntaxErrTest(format) {
  const file = `fixtures/foo-invalid.${format}`;

  return () => {
    expect.assertions(2);
    expect(() => configFileLoader({ sync: true }, file)).toThrow(
      /^Failed to parse/
    );

    return configFileLoader(null, file).catch(err => {
      expect(err.message).toMatch(/^Failed to parse/);
    });
  };
}

const expectForFormat = {
  json(err) {
    expect(err.message).toMatch(/JSON Error/);
  },
  yaml(err) {
    expect(err.name).toBe('YAMLException');
  },
  js(err) {
    expect(err.name).toBe('ReferenceError');
  },
};

function makeSyntaxErrWithFormatTest(format) {
  const file = `fixtures/foo-invalid.${format}`;
  return () => {
    expect.assertions(2);
    try {
      configFileLoader({ sync: true, format }, file);
    } catch (err) {
      expectForFormat[format](err);
    }

    return configFileLoader({ format }, file).catch(expectForFormat[format]);
  };
}

function makeEmptyFileTest(fileFormat, withFormat) {
  const format = withFormat === true ? fileFormat : undefined;
  const file = `fixtures/foo-empty.${fileFormat}`;
  return () => {
    expect.assertions(2);
    expect(() => configFileLoader({ sync: true, format }, file)).toThrow(
      /^Config file is empty/
    );

    return configFileLoader({ format }, file).catch(err => {
      expect(err.message).toMatch(/^Config file is empty/);
    });
  };
}

describe('cosmiconfig', () => {
  util.testSyncAndAsync(
    'returns null if neither searchPath nor configPath are specified',
    sync => () => {
      expect.hasAssertions();
      return util.testFuncsRunner(sync, cosmiconfig(null, { sync }).load(), [
        result => {
          expect(result).toBeNull();
        },
      ]);
    }
  );

  describe('load from file', () => {
    it('throws error if defined file does not exist', () => {
      expect.assertions(2);
      try {
        configFileLoader({ sync: true }, 'does/not/exist');
      } catch (err) {
        expect(err.code).toBe('ENOENT');
      }

      return configFileLoader(null, 'does/not/exist').catch(err => {
        expect(err.code).toBe('ENOENT');
      });
    });

    describe('without expected format', () => {
      it(
        'throws error if defined JSON file has syntax error',
        makeSyntaxErrTest('json')
      );

      it(
        'throws error if defined YAML file has syntax error',
        makeSyntaxErrTest('yaml')
      );

      it(
        'throws error if defined JS file has syntax error',
        makeSyntaxErrTest('js')
      );

      it('throws error for empty file, format JS', makeEmptyFileTest('js'));

      it('throws error for empty file, format JSON', makeEmptyFileTest('json'));

      it('throws error for empty file, format YAML', makeEmptyFileTest('yaml'));
    });

    describe('with expected format', () => {
      it(
        'throws error if defined JSON file has syntax error',
        makeSyntaxErrWithFormatTest('json')
      );

      it(
        'throws error if defined YAML file has syntax error',
        makeSyntaxErrWithFormatTest('yaml')
      );

      it(
        'throws error if defined JS file has syntax error',
        makeSyntaxErrWithFormatTest('js')
      );

      it(
        'throws error for empty file, format JS',
        makeEmptyFileTest('js', true)
      );

      it(
        'throws error for empty file, format JSON',
        makeEmptyFileTest('json', true)
      );

      it(
        'throws error for empty file, format YAML',
        makeEmptyFileTest('yaml', true)
      );
    });

    it('returns null if configuration file does not exist', () => {
      const loadConfig = sync =>
        cosmiconfig('not_exist_rc_name', { sync }).load('.');

      expect.assertions(2);
      expect(loadConfig(true)).toBe(null);
      return expect(loadConfig(false)).resolves.toBe(null);
    });
  });
});
