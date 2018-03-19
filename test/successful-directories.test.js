'use strict';

jest.mock('fs');

const fsMock = require('fs');

const util = require('./util');
const cosmiconfig = require('../src');

const absolutePath = util.absolutePath;
const mockReadFile = util.mockReadFile;
const testFuncsRunner = util.testFuncsRunner;
const testSyncAndAsync = util.testSyncAndAsync;

beforeAll(() => {
  util.mockStatIsDirectory(true);
});

afterEach(() => {
  // Resets all information stored in the mock,
  // including any inital implementation given.
  fsMock.readFile.mockReset();
  fsMock.readFileSync.mockReset();

  // Clean up a mock's usage data between tests
  fsMock.stat.mockClear();
  fsMock.statSync.mockClear();
});

afterAll(() => {
  jest.resetAllMocks();
});

describe('cosmiconfig', () => {
  describe('search from directory', () => {
    const search = (sync, startDir) =>
      cosmiconfig('foo', { stopDir: absolutePath('.'), sync }).search(startDir);

    testSyncAndAsync(
      'finds rc file in third searched dir, with a package.json lacking prop',
      sync => () => {
        function readFile(searchPath) {
          switch (searchPath) {
            case absolutePath('a/b/c/d/e/f/package.json'):
            case absolutePath('a/b/c/d/e/f/.foorc'):
            case absolutePath('a/b/c/d/e/f/foo.config.js'):
            case absolutePath('a/b/c/d/e/package.json'):
            case absolutePath('a/b/c/d/e/.foorc'):
            case absolutePath('a/b/c/d/e/foo.config.js'):
              throw { code: 'ENOENT' };
            case absolutePath('a/b/c/d/package.json'):
              return '{ "false": "hope" }';
            case absolutePath('a/b/c/d/.foorc'):
              return '{ "found": true }';
            default:
              throw new Error(`irrelevant path ${searchPath}`);
          }
        }
        const readFileMock = mockReadFile(sync, readFile);
        const startDir = absolutePath('a/b/c/d/e/f');

        expect.hasAssertions();
        return testFuncsRunner(sync, search(sync, startDir), [
          result => {
            util.assertSearchSequence(readFileMock, [
              'a/b/c/d/e/f/package.json',
              'a/b/c/d/e/f/.foorc',
              'a/b/c/d/e/f/foo.config.js',
              'a/b/c/d/e/package.json',
              'a/b/c/d/e/.foorc',
              'a/b/c/d/e/foo.config.js',
              'a/b/c/d/package.json',
              'a/b/c/d/.foorc',
            ]);

            expect(result).toEqual({
              config: { found: true },
              filepath: absolutePath('a/b/c/d/.foorc'),
            });
          },
        ]);
      }
    );

    testSyncAndAsync(
      'finds package.json prop in second searched dir',
      sync => () => {
        function readFile(searchPath) {
          switch (searchPath) {
            case absolutePath('a/b/c/d/e/f/package.json'):
            case absolutePath('a/b/c/d/e/f/.foorc'):
            case absolutePath('a/b/c/d/e/f/foo.config.js'):
            case absolutePath('a/b/c/d/e/.foorc'):
            case absolutePath('a/b/c/d/e/foo.config.js'):
              throw { code: 'ENOENT' };
            case absolutePath('a/b/c/d/e/package.json'):
              return '{ "author": "Todd", "foo": { "found": true } }';
            default:
              throw new Error(`irrelevant path ${searchPath}`);
          }
        }
        const readFileMock = mockReadFile(sync, readFile);
        const startDir = absolutePath('a/b/c/d/e/f');

        expect.hasAssertions();
        return testFuncsRunner(sync, search(sync, startDir), [
          result => {
            util.assertSearchSequence(readFileMock, [
              'a/b/c/d/e/f/package.json',
              'a/b/c/d/e/f/.foorc',
              'a/b/c/d/e/f/foo.config.js',
              'a/b/c/d/e/package.json',
            ]);

            expect(result).toEqual({
              config: { found: true },
              filepath: absolutePath('a/b/c/d/e/package.json'),
            });
          },
        ]);
      }
    );

    testSyncAndAsync('finds JS file in first searched dir', sync => () => {
      function readFile(searchPath) {
        switch (searchPath) {
          case absolutePath('a/b/c/d/e/f/package.json'):
          case absolutePath('a/b/c/d/e/f/.foorc'):
          case absolutePath('a/b/c/d/e/package.json'):
          case absolutePath('a/b/c/d/e/.foorc'):
          case absolutePath('a/b/c/d/e/foo.config.js'):
            throw { code: 'ENOENT' };
          case absolutePath('a/b/c/d/e/f/foo.config.js'):
            return 'module.exports = { found: true };';
          default:
            throw new Error(`irrelevant path ${searchPath}`);
        }
      }
      const readFileMock = mockReadFile(sync, readFile);
      const startDir = absolutePath('a/b/c/d/e/f');

      expect.hasAssertions();
      return testFuncsRunner(sync, search(sync, startDir), [
        result => {
          util.assertSearchSequence(readFileMock, [
            'a/b/c/d/e/f/package.json',
            'a/b/c/d/e/f/.foorc',
            'a/b/c/d/e/f/foo.config.js',
          ]);

          expect(result).toEqual({
            config: { found: true },
            filepath: absolutePath('a/b/c/d/e/f/foo.config.js'),
          });
        },
      ]);
    });

    testSyncAndAsync(
      'finds JS ES Modules file in first searched dir',
      sync => () => {
        function readFile(searchPath) {
          switch (searchPath) {
            case absolutePath('a/b/c/d/e/f/package.json'):
            case absolutePath('a/b/c/d/e/f/.foorc'):
            case absolutePath('a/b/c/d/e/package.json'):
            case absolutePath('a/b/c/d/e/.foorc'):
            case absolutePath('a/b/c/d/e/foo.config.js'):
              throw { code: 'ENOENT' };
            case absolutePath('a/b/c/d/e/f/foo.config.js'):
              return `Object.defineProperty(exports, '__esModule',{value: true});
              const config={found:true};exports.default=config;`;
            default:
              throw new Error(`irrelevant path ${searchPath}`);
          }
        }
        const readFileMock = mockReadFile(sync, readFile);
        const startDir = absolutePath('a/b/c/d/e/f');

        expect.hasAssertions();
        return testFuncsRunner(sync, search(sync, startDir), [
          result => {
            util.assertSearchSequence(readFileMock, [
              'a/b/c/d/e/f/package.json',
              'a/b/c/d/e/f/.foorc',
              'a/b/c/d/e/f/foo.config.js',
            ]);

            expect(result).toEqual({
              config: { found: true },
              filepath: absolutePath('a/b/c/d/e/f/foo.config.js'),
            });
          },
        ]);
      }
    );

    testSyncAndAsync(
      'finds package.json in second dir searched, with alternate names',
      sync => () => {
        function readFile(searchPath) {
          switch (searchPath) {
            case absolutePath('a/b/c/d/e/f/package.json'):
            case absolutePath('a/b/c/d/e/f/.wowza'):
            case absolutePath('a/b/c/d/e/f/wowzaConfig.js'):
              throw { code: 'ENOENT' };
            case absolutePath('a/b/c/d/e/package.json'):
              return '{ "heeha": { "found": true } }';
            default:
              throw new Error(`irrelevant path ${searchPath}`);
          }
        }
        const readFileMock = mockReadFile(sync, readFile);
        const startDir = absolutePath('a/b/c/d/e/f');

        expect.hasAssertions();
        return testFuncsRunner(
          sync,
          cosmiconfig('foo', {
            rc: '.wowza',
            js: 'wowzaConfig.js',
            packageProp: 'heeha',
            stopDir: absolutePath('.'),
            sync,
          }).search(startDir),
          [
            result => {
              util.assertSearchSequence(readFileMock, [
                'a/b/c/d/e/f/package.json',
                'a/b/c/d/e/f/.wowza',
                'a/b/c/d/e/f/wowzaConfig.js',
                'a/b/c/d/e/package.json',
              ]);

              expect(result).toEqual({
                config: { found: true },
                filepath: absolutePath('a/b/c/d/e/package.json'),
              });
            },
          ]
        );
      }
    );

    testSyncAndAsync(
      'finds rc file in third searched dir, skipping packageProp, with rcStrictJson',
      sync => () => {
        function readFile(searchPath) {
          switch (searchPath) {
            case absolutePath('a/b/c/d/e/f/package.json'):
            case absolutePath('a/b/c/d/e/f/.foorc'):
            case absolutePath('a/b/c/d/e/f/foo.config.js'):
            case absolutePath('a/b/c/d/e/package.json'):
            case absolutePath('a/b/c/d/e/.foorc'):
            case absolutePath('a/b/c/d/e/foo.config.js'):
            case absolutePath('a/b/c/d/package.json'):
              throw { code: 'ENOENT' };
            case absolutePath('a/b/c/d/.foorc'):
              return '{ "found": true }';
            default:
              throw new Error(`irrelevant path ${searchPath}`);
          }
        }
        const readFileMock = mockReadFile(sync, readFile);
        const startDir = absolutePath('a/b/c/d/e/f');

        expect.hasAssertions();
        return testFuncsRunner(
          sync,
          cosmiconfig('foo', {
            packageProp: false,
            rcStrictJson: true,
            stopDir: absolutePath('.'),
            sync,
          }).search(startDir),
          [
            result => {
              util.assertSearchSequence(readFileMock, [
                'a/b/c/d/e/f/.foorc',
                'a/b/c/d/e/f/foo.config.js',
                'a/b/c/d/e/.foorc',
                'a/b/c/d/e/foo.config.js',
                'a/b/c/d/.foorc',
              ]);

              expect(result).toEqual({
                config: { found: true },
                filepath: absolutePath('a/b/c/d/.foorc'),
              });
            },
          ]
        );
      }
    );

    testSyncAndAsync(
      'finds rc file in third searched dir, skipping packageProp, with rcStrictJson',
      sync => () => {
        function readFile(searchPath) {
          switch (searchPath) {
            case absolutePath('a/b/c/d/e/f/package.json'):
            case absolutePath('a/b/c/d/e/f/.foorc'):
            case absolutePath('a/b/c/d/e/f/foo.config.js'):
            case absolutePath('a/b/c/d/e/.foorc'):
            case absolutePath('a/b/c/d/e/foo.config.js'):
              throw { code: 'ENOENT' };
            case absolutePath('a/b/c/d/e/package.json'):
              return '{ "author": "Todd", "foo": { "found": true } }';
            default:
              throw new Error(`irrelevant path ${searchPath}`);
          }
        }
        const readFileMock = mockReadFile(sync, readFile);
        const startDir = absolutePath('a/b/c/d/e/f');

        expect.hasAssertions();
        return testFuncsRunner(
          sync,
          cosmiconfig('foo', {
            js: false,
            rc: false,
            stopDir: absolutePath('.'),
            sync,
          }).search(startDir),
          [
            result => {
              util.assertSearchSequence(readFileMock, [
                'a/b/c/d/e/f/package.json',
                'a/b/c/d/e/package.json',
              ]);

              expect(result).toEqual({
                config: { found: true },
                filepath: absolutePath('a/b/c/d/e/package.json'),
              });
            },
          ]
        );
      }
    );

    testSyncAndAsync('finds JS file traversing from cwd', sync => () => {
      const originalCwd = process.cwd;
      expect.hasAssertions();

      function readFile(searchPath) {
        switch (searchPath) {
          case absolutePath('a/b/c/d/e/f/package.json'):
          case absolutePath('a/b/c/d/e/f/.foorc'):
          case absolutePath('a/b/c/d/e/f/foo.config.js'):
          case absolutePath('a/b/c/d/e/package.json'):
          case absolutePath('a/b/c/d/e/.foorc'):
            throw { code: 'ENOENT' };
          case absolutePath('a/b/c/d/e/foo.config.js'):
            return 'module.exports = { found: true };';
          default:
            throw new Error(`irrelevant path ${searchPath}`);
        }
      }

      try {
        const readFileMock = mockReadFile(sync, readFile);
        process.cwd = jest.fn(() => absolutePath('a/b/c/d/e/f'));

        return testFuncsRunner(sync, search(sync), [
          result => {
            util.assertSearchSequence(readFileMock, [
              'a/b/c/d/e/f/package.json',
              'a/b/c/d/e/f/.foorc',
              'a/b/c/d/e/f/foo.config.js',
              'a/b/c/d/e/package.json',
              'a/b/c/d/e/.foorc',
              'a/b/c/d/e/foo.config.js',
            ]);

            expect(result).toEqual({
              config: { found: true },
              filepath: absolutePath('a/b/c/d/e/foo.config.js'),
            });
          },
        ]);
      } finally {
        process.cwd = originalCwd;
      }
    });

    // RC file with specified extension

    describe('with rcExtensions', () => {
      const search = (sync, startDir) =>
        cosmiconfig('foo', {
          stopDir: absolutePath('.'),
          rcExtensions: true,
          sync,
        }).search(startDir);

      testSyncAndAsync(
        'finds .foorc.json in second searched dir',
        sync => () => {
          function readFile(searchPath) {
            switch (searchPath) {
              case absolutePath('a/b/c/d/e/f/package.json'):
              case absolutePath('a/b/c/d/e/f/.foorc'):
              case absolutePath('a/b/c/d/e/f/.foorc.json'):
              case absolutePath('a/b/c/d/e/f/.foorc.yaml'):
              case absolutePath('a/b/c/d/e/f/.foorc.yml'):
              case absolutePath('a/b/c/d/e/f/.foorc.js'):
              case absolutePath('a/b/c/d/e/f/foo.config.js'):
              case absolutePath('a/b/c/d/e/package.json'):
              case absolutePath('a/b/c/d/e/.foorc'):
                throw { code: 'ENOENT' };
              case absolutePath('a/b/c/d/e/.foorc.json'):
                return '{ "found": true }';
              default:
                throw new Error(`irrelevant path ${searchPath}`);
            }
          }
          const readFileMock = mockReadFile(sync, readFile);
          const startDir = absolutePath('a/b/c/d/e/f');

          expect.hasAssertions();
          return testFuncsRunner(sync, search(sync, startDir), [
            result => {
              util.assertSearchSequence(readFileMock, [
                'a/b/c/d/e/f/package.json',
                'a/b/c/d/e/f/.foorc',
                'a/b/c/d/e/f/.foorc.json',
                'a/b/c/d/e/f/.foorc.yaml',
                'a/b/c/d/e/f/.foorc.yml',
                'a/b/c/d/e/f/.foorc.js',
                'a/b/c/d/e/f/foo.config.js',
                'a/b/c/d/e/package.json',
                'a/b/c/d/e/.foorc',
                'a/b/c/d/e/.foorc.json',
              ]);

              expect(result).toEqual({
                config: { found: true },
                filepath: absolutePath('a/b/c/d/e/.foorc.json'),
              });
            },
          ]);
        }
      );

      testSyncAndAsync(
        'finds .foorc.yaml in first searched dir',
        sync => () => {
          function readFile(searchPath) {
            switch (searchPath) {
              case absolutePath('a/b/c/d/e/f/package.json'):
              case absolutePath('a/b/c/d/e/f/.foorc'):
              case absolutePath('a/b/c/d/e/f/.foorc.json'):
                throw { code: 'ENOENT' };
              case absolutePath('a/b/c/d/e/f/.foorc.yaml'):
                return 'found: true';
              default:
                throw new Error(`irrelevant path ${searchPath}`);
            }
          }
          const readFileMock = mockReadFile(sync, readFile);
          const startDir = absolutePath('a/b/c/d/e/f');

          expect.hasAssertions();
          return testFuncsRunner(sync, search(sync, startDir), [
            result => {
              util.assertSearchSequence(readFileMock, [
                'a/b/c/d/e/f/package.json',
                'a/b/c/d/e/f/.foorc',
                'a/b/c/d/e/f/.foorc.json',
                'a/b/c/d/e/f/.foorc.yaml',
              ]);

              expect(result).toEqual({
                config: { found: true },
                filepath: absolutePath('a/b/c/d/e/f/.foorc.yaml'),
              });
            },
          ]);
        }
      );

      testSyncAndAsync(
        'finds .foorc.yaml in first searched dir',
        sync => () => {
          function readFile(searchPath) {
            switch (searchPath) {
              case absolutePath('a/b/c/d/e/f/package.json'):
              case absolutePath('a/b/c/d/e/f/.foorc'):
              case absolutePath('a/b/c/d/e/f/.foorc.json'):
              case absolutePath('a/b/c/d/e/f/.foorc.yaml'):
                throw { code: 'ENOENT' };
              case absolutePath('a/b/c/d/e/f/.foorc.yml'):
                return 'found: true';
              default:
                throw new Error(`irrelevant path ${searchPath}`);
            }
          }
          const readFileMock = mockReadFile(sync, readFile);
          const startDir = absolutePath('a/b/c/d/e/f');

          expect.hasAssertions();
          return testFuncsRunner(sync, search(sync, startDir), [
            result => {
              util.assertSearchSequence(readFileMock, [
                'a/b/c/d/e/f/package.json',
                'a/b/c/d/e/f/.foorc',
                'a/b/c/d/e/f/.foorc.json',
                'a/b/c/d/e/f/.foorc.yaml',
                'a/b/c/d/e/f/.foorc.yml',
              ]);

              expect(result).toEqual({
                config: { found: true },
                filepath: absolutePath('a/b/c/d/e/f/.foorc.yml'),
              });
            },
          ]);
        }
      );

      testSyncAndAsync('finds .foorc.js in first searched dir', sync => () => {
        function readFile(searchPath) {
          switch (searchPath) {
            case absolutePath('a/b/c/d/e/f/package.json'):
            case absolutePath('a/b/c/d/e/f/.foorc'):
            case absolutePath('a/b/c/d/e/f/.foorc.json'):
            case absolutePath('a/b/c/d/e/f/.foorc.yaml'):
            case absolutePath('a/b/c/d/e/f/.foorc.yml'):
              throw { code: 'ENOENT' };
            case absolutePath('a/b/c/d/e/f/.foorc.js'):
              return 'module.exports = { found: true };';
            default:
              throw new Error(`irrelevant path ${searchPath}`);
          }
        }
        const readFileMock = mockReadFile(sync, readFile);
        const startDir = absolutePath('a/b/c/d/e/f');

        expect.hasAssertions();
        return testFuncsRunner(sync, search(sync, startDir), [
          result => {
            util.assertSearchSequence(readFileMock, [
              'a/b/c/d/e/f/package.json',
              'a/b/c/d/e/f/.foorc',
              'a/b/c/d/e/f/.foorc.json',
              'a/b/c/d/e/f/.foorc.yaml',
              'a/b/c/d/e/f/.foorc.yml',
              'a/b/c/d/e/f/.foorc.js',
            ]);

            expect(result).toEqual({
              config: { found: true },
              filepath: absolutePath('a/b/c/d/e/f/.foorc.js'),
            });
          },
        ]);
      });
    });
  });
});
