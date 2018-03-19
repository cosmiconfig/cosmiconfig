'use strict';

const util = require('./util');
const cosmiconfig = require('../src');

const absolutePath = util.absolutePath;
const configFileLoader = util.configFileLoader;
const testFuncsRunner = util.testFuncsRunner;
const testSyncAndAsync = util.testSyncAndAsync;

function makeFileTest(file, format) {
  return sync => () => {
    expect.hasAssertions();
    return testFuncsRunner(sync, configFileLoader({ sync, format }, file), [
      result => {
        expect(result.config).toEqual({
          foo: true,
        });
        expect(result.filepath).toBe(absolutePath(file));
      },
    ]);
  };
}

describe('cosmiconfig', () => {
  describe('load from file', () => {
    describe('format not specified', () => {
      testSyncAndAsync(
        'loads defined JSON config path',
        makeFileTest('fixtures/foo.json')
      );

      testSyncAndAsync(
        'loads defined YAML config path',
        makeFileTest('fixtures/foo.yaml')
      );

      testSyncAndAsync(
        'loads defined JS config path',
        makeFileTest('fixtures/foo.js')
      );

      testSyncAndAsync(
        'loads modularized JS config path',
        makeFileTest('fixtures/foo-module.js')
      );

      testSyncAndAsync(
        'loads defined JS ES Modules config path',
        makeFileTest('fixtures/cjs-es-module.js')
      );

      testSyncAndAsync(
        'loads yaml-like JS config path',
        makeFileTest('fixtures/foo-yaml-like.js')
      );
    });

    describe('format specified', () => {
      testSyncAndAsync(
        'loads defined JSON config path',
        makeFileTest('fixtures/foo.json', 'json')
      );

      testSyncAndAsync(
        'loads defined YAML config path',
        makeFileTest('fixtures/foo.yaml', 'yaml')
      );

      testSyncAndAsync(
        'loads defined JS config path',
        makeFileTest('fixtures/foo.js', 'js')
      );

      testSyncAndAsync(
        'loads modularized JS config path',
        makeFileTest('fixtures/foo-module.js', 'js')
      );

      testSyncAndAsync(
        'loads defined JS ES Modules config path',
        makeFileTest('fixtures/cjs-es-module.js', 'js')
      );

      testSyncAndAsync(
        'loads yaml-like JS config path',
        makeFileTest('fixtures/foo-yaml-like.js', 'js')
      );
    });

    testSyncAndAsync('respects options.configPath', sync => () => {
      const configPath = absolutePath('fixtures/foo.json');
      const explorer = cosmiconfig('foo', { configPath, sync });
      return testFuncsRunner(sync, explorer.load(), [
        result => {
          expect(result.config).toEqual({
            foo: true,
          });
          expect(result.filepath).toBe(configPath);
        },
      ]);
    });

    testSyncAndAsync(
      'loads package prop when configPath is package.json',
      sync => () => {
        const configPath = absolutePath('fixtures/package.json');
        const explorer = cosmiconfig('foo', { configPath, sync });
        return testFuncsRunner(sync, explorer.load(), [
          result => {
            expect(result.config).toEqual({
              bar: 'baz',
            });
          },
        ]);
      }
    );

    testSyncAndAsync('runs transform', sync => () => {
      expect.hasAssertions();
      return testFuncsRunner(
        sync,
        configFileLoader(
          {
            sync,
            transform(result) {
              result.config.foo = [result.config.foo];
              return result;
            },
          },
          'fixtures/foo.json'
        ),
        [
          result => {
            expect(result.config).toEqual({ foo: [true] });
          },
        ]
      );
    });

    it('does not swallow transform errors', () => {
      const load = sync =>
        configFileLoader(
          {
            sync,
            transform() {
              throw new Error('These pretzels are making me thirsty!');
            },
          },
          'fixtures/foo.json'
        );

      expect.assertions(2);
      expect(() => load(true)).toThrow('These pretzels are making me thirsty!');

      return load(false).catch(err => {
        expect(err.message).toBe('These pretzels are making me thirsty!');
      });
    });
  });
});
