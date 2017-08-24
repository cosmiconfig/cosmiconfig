'use strict';

const util = require('./util');
const cosmiconfig = require('..');

const absolutePath = util.absolutePath;
const configFileLoader = util.configFileLoader;
const testFuncsRunner = util.testFuncsRunner;
const testSyncAndAsync = util.testSyncAndAsync;

function makeFileTest(file) {
  return sync => () => {
    expect.hasAssertions();
    return testFuncsRunner(sync, configFileLoader({ sync }, file), [
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

    testSyncAndAsync('respects options.configPath', sync => () => {
      const configPath = absolutePath('fixtures/foo.json');
      const explorer = cosmiconfig('foo', { configPath, sync });
      return testFuncsRunner(sync, explorer.load('./path/does/not/exist'), [
        result => {
          expect(result.config).toEqual({
            foo: true,
          });
          expect(result.filepath).toBe(configPath);
        },
      ]);
    });

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
      const loadConfig = sync =>
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
      expect(() => loadConfig(true)).toThrow(
        'These pretzels are making me thirsty!'
      );

      return loadConfig(false).catch(err => {
        expect(err.message).toBe('These pretzels are making me thirsty!');
      });
    });
  });
});
