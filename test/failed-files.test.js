'use strict';

const path = require('path');
const util = require('./util');
const cosmiconfig = require('../src');

const configFileLoader = util.configFileLoader;

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

function makeSyntaxErrWithoutKnownExtnameTest(format) {
  const file = `fixtures/foo-invalid-${format}`;

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

function makeSyntaxErrTest(format) {
  const file = `fixtures/foo-invalid.${format}`;

  return () => {
    expect.assertions(2);
    try {
      configFileLoader({ sync: true }, file);
    } catch (err) {
      expectForFormat[format](err);
    }

    return configFileLoader(null, file).catch(expectForFormat[format]);
  };
}

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
    const expectedResult = {
      config: undefined,
      filepath: path.join(__dirname, file),
      isEmpty: true,
    };

    expect(configFileLoader({ sync: true, format }, file)).toEqual(
      expectedResult
    );

    return expect(configFileLoader({ format }, file)).resolves.toEqual(
      expectedResult
    );
  };
}

describe('cosmiconfig', () => {
  describe('search from file', () => {
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

      it(
        'returns an empty config result for an empty file, format JS',
        makeEmptyFileTest('js')
      );

      it('throws error for empty file, format JS', makeEmptyFileTest('js'));

      it(
        'returns an empty config result for an empty file, format JSON',
        makeEmptyFileTest('json')
      );

      it(
        'returns an empty config result for an empty file, format YAML',
        makeEmptyFileTest('yaml')
      );
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
        'returns an empty config result for an empty file, format JS',
        makeEmptyFileTest('js', true)
      );

      it(
        'returns an empty config result for an empty file, format JSON',
        makeEmptyFileTest('json', true)
      );

      it(
        'returns an empty config result for an empty file, format YAML',
        makeEmptyFileTest('yaml', true)
      );
    });

    describe('with unknown extname', () => {
      it(
        'throws error if defined JSON file has syntax error',
        makeSyntaxErrWithoutKnownExtnameTest('json')
      );

      it(
        'throws error if defined YAML file has syntax error',
        makeSyntaxErrWithoutKnownExtnameTest('yaml')
      );

      it(
        'throws error if defined JS file has syntax error',
        makeSyntaxErrWithoutKnownExtnameTest('js')
      );

      it(
        'throws error if defined JS ES Modules file has syntax error',
        makeSyntaxErrWithoutKnownExtnameTest('cjs-es-module-js')
      );
    });

    it('returns null if configuration file does not exist', () => {
      const load = sync =>
        cosmiconfig('not_exist_rc_name', { sync }).search('.');

      expect.assertions(2);
      expect(load(true)).toBe(null);
      return expect(load(false)).resolves.toBe(null);
    });

    it('in sync mode, throws error if configPath is package.json and packageProp is false', () => {
      expect(() =>
        cosmiconfig('foo', { sync: true, packageProp: false }).load(
          path.join(__dirname, 'fixtures/package.json')
        )
      ).toThrow(/Please specify the packageProp option/);
    });

    it('in async mode, rejects if configPath is package.json and packageProp is false', () => {
      expect.assertions(1);
      return cosmiconfig('foo', { packageProp: false })
        .load(path.join(__dirname, 'fixtures/package.json'))
        .catch(error => {
          expect(error.message).toContain(
            'Please specify the packageProp option'
          );
        });
    });

    it('throws an error if no configPath was specified', () => {
      const load = sync => cosmiconfig('not_exist_rc_name', { sync }).load();
      const errorRegex = /^configPath must be a nonempty string/;

      expect.assertions(2);
      expect(() => load(true)).toThrow(errorRegex);

      return load(false).catch(error => {
        expect(error.message).toMatch(errorRegex);
      });
    });

    it('throws an error if non-default es module', () => {
      const load = sync =>
        cosmiconfig('foo', { sync }).load(
          path.join(__dirname, 'fixtures/cjs-es-module-missing-default.js')
        );
      const errorRegex = /must use default export with ES Modules/;

      expect.assertions(2);
      expect(() => load(true)).toThrow(errorRegex);

      return load(false).catch(error => {
        expect(error.message).toMatch(errorRegex);
      });
    });

    it('throws an error if non-default es module with missing extension', () => {
      const load = sync =>
        configFileLoader({ sync }, 'fixtures/cjs-es-module-missing-default');
      const errorRegex = /must use default export with ES Modules/;

      expect.assertions(2);
      expect(() => load(true)).toThrow(errorRegex);

      return load(false).catch(error => {
        expect(error.message).toMatch(errorRegex);
      });
    });
  });
});
