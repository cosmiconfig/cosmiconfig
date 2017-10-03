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

const statMockFor = sync => (sync === true ? fsMock.statSync : fsMock.stat);

describe('cosmiconfig', () => {
  describe('load from directory', () => {
    testSyncAndAsync('gives up if it cannot find the file', sync => () => {
      function readFile(searchPath) {
        switch (searchPath) {
          case absolutePath('a/b/package.json'):
          case absolutePath('a/b/.foorc'):
          case absolutePath('a/b/foo.config.js'):
          case absolutePath('a/package.json'):
          case absolutePath('a/.foorc'):
          case absolutePath('a/foo.config.js'):
          case absolutePath('package.json'):
          case absolutePath('.foorc'):
          case absolutePath('foo.config.js'):
            throw { code: 'ENOENT' };
          default:
            throw new Error(`irrelevant path ${searchPath}`);
        }
      }
      const readFileMock = mockReadFile(sync, readFile);
      const statMock = statMockFor(sync);

      const startDir = absolutePath('a/b');
      const loadConfig = cosmiconfig('foo', {
        stopDir: absolutePath('.'),
        sync,
      }).load;

      expect.hasAssertions();
      return testFuncsRunner(sync, loadConfig(startDir), [
        result => {
          expect(statMock).toHaveBeenCalledTimes(1);
          expect(statMock.mock.calls[0][0]).toBe(startDir);

          util.assertSearchSequence(readFileMock, [
            'a/b/package.json',
            'a/b/.foorc',
            'a/b/foo.config.js',
            'a/package.json',
            'a/.foorc',
            'a/foo.config.js',
            './package.json',
            './.foorc',
            './foo.config.js',
          ]);
          expect(result).toBe(null);
        },
      ]);
    });

    testSyncAndAsync('stops at stopDir and gives up', sync => () => {
      function readFile(searchPath) {
        switch (searchPath) {
          case absolutePath('a/b/package.json'):
          case absolutePath('a/b/.foorc'):
          case absolutePath('a/b/foo.config.js'):
          case absolutePath('a/package.json'):
          case absolutePath('a/.foorc'):
          case absolutePath('a/foo.config.js'):
          case absolutePath('/package.json'):
          case absolutePath('/.foorc'):
          case absolutePath('/foo.config.js'):
            throw { code: 'ENOENT' };
          default:
            throw new Error(`irrelevant path ${searchPath}`);
        }
      }
      const readFileMock = mockReadFile(sync, readFile);

      const startDir = absolutePath('a/b');
      const loadConfig = cosmiconfig('foo', {
        stopDir: absolutePath('a'),
        sync,
      }).load;

      expect.hasAssertions();
      return testFuncsRunner(sync, loadConfig(startDir), [
        result => {
          util.assertSearchSequence(readFileMock, [
            'a/b/package.json',
            'a/b/.foorc',
            'a/b/foo.config.js',
            'a/package.json',
            'a/.foorc',
            'a/foo.config.js',
          ]);
          expect(result).toBe(null);
        },
      ]);
    });

    if (process.platform === 'win32') {
      testSyncAndAsync(
        'stops at UNC path device name and gives up',
        sync => () => {
          function readFile(searchPath) {
            switch (searchPath) {
              case '\\\\device\\c$\\a\\b\\package.json':
              case '\\\\device\\c$\\a\\package.json':
              case '\\\\device\\c$\\package.json':
                throw { code: 'ENOENT' };
              default:
                throw new Error(`irrelevant path ${searchPath}`);
            }
          }
          const readFileMock = mockReadFile(sync, readFile);

          const startDir = '\\\\device\\c$\\a\\b\\';
          const loadConfig = cosmiconfig('foo', {
            js: false,
            rc: false,
            sync,
          }).load;

          expect.hasAssertions();
          return testFuncsRunner(sync, loadConfig(startDir), [
            result => {
              util.assertSearchSequence(
                readFileMock,
                [
                  '\\\\device\\c$\\a\\b\\package.json',
                  '\\\\device\\c$\\a\\package.json',
                  '\\\\device\\c$\\package.json',
                ],
                0,
                true
              );
              expect(result).toBe(null);
            },
          ]);
        }
      );
    }

    it('throws error for invalid YAML in rc file', () => {
      function readFile(searchPath) {
        switch (searchPath) {
          case absolutePath('a/b/package.json'):
            throw { code: 'ENOENT' };
          case absolutePath('a/b/.foorc'):
            return 'found: true: broken';
          default:
            throw new Error(`irrelevant path ${searchPath}`);
        }
      }
      mockReadFile(true, readFile);
      mockReadFile(false, readFile);

      const startDir = absolutePath('a/b');
      const loadConfig = sync =>
        cosmiconfig('foo', { stopDir: absolutePath('a'), sync }).load(startDir);

      expect.assertions(2);
      try {
        loadConfig(true);
      } catch (err) {
        expect(err.name).toBe('YAMLException');
      }
      return loadConfig(false).catch(err => {
        expect(err.name).toBe('YAMLException');
      });
    });

    it('throws error for invalid JSON in rc file with rcStrictJson', () => {
      function readFile(searchPath) {
        switch (searchPath) {
          case absolutePath('a/b/package.json'):
            throw { code: 'ENOENT' };
          case absolutePath('a/b/.foorc'):
            return '{ "found": true, }';
          default:
            throw new Error(`irrelevant path ${searchPath}`);
        }
      }
      mockReadFile(true, readFile);
      mockReadFile(false, readFile);

      const startDir = absolutePath('a/b');
      const loadConfig = sync =>
        cosmiconfig('foo', {
          stopDir: absolutePath('a'),
          rcStrictJson: true,
          sync,
        }).load(startDir);

      expect.assertions(2);
      expect(() => loadConfig(true)).toThrow(/JSON Error/);
      return loadConfig(false).catch(err => {
        expect(err.message).toMatch(/JSON Error/);
      });
    });

    it('throws error for invalid package.json', () => {
      function readFile(searchPath) {
        switch (searchPath) {
          case absolutePath('a/b/package.json'):
            return '{ "foo": "bar", }';
          default:
            throw new Error(`irrelevant path ${searchPath}`);
        }
      }
      mockReadFile(true, readFile);
      mockReadFile(false, readFile);

      const startDir = absolutePath('a/b');
      const loadConfig = sync =>
        cosmiconfig('foo', { stopDir: absolutePath('a'), sync }).load(startDir);

      expect.assertions(2);
      expect(() => loadConfig(true)).toThrow(/JSON Error/);
      return loadConfig(false).catch(err => {
        expect(err.message).toMatch(/JSON Error/);
      });
    });

    it('throws error for invalid JS in .config.js file', () => {
      function readFile(searchPath) {
        switch (searchPath) {
          case absolutePath('a/b/package.json'):
          case absolutePath('a/b/.foorc'):
            throw { code: 'ENOENT' };
          case absolutePath('a/b/foo.config.js'):
            return 'module.exports = { found: true: false,';
          default:
            throw new Error(`irrelevant path ${searchPath}`);
        }
      }
      mockReadFile(true, readFile);
      mockReadFile(false, readFile);

      const startDir = absolutePath('a/b');
      const loadConfig = sync =>
        cosmiconfig('foo', { stopDir: absolutePath('a'), sync }).load(startDir);

      expect.assertions(2);
      try {
        loadConfig(true);
      } catch (err) {
        expect(err.name).toBe('SyntaxError');
      }
      return loadConfig(false).catch(err => {
        expect(err.name).toBe('SyntaxError');
      });
    });

    describe('with rcExtensions', () => {
      const startDir = absolutePath('a/b/c/d/e/f');
      const loadConfig = sync =>
        cosmiconfig('foo', {
          stopDir: absolutePath('.'),
          rcExtensions: true,
          sync,
        }).load(startDir);
      it('throws error for invalid JSON in .foorc.json', () => {
        function readFile(searchPath) {
          switch (searchPath) {
            case absolutePath('a/b/c/d/e/f/package.json'):
            case absolutePath('a/b/c/d/e/f/.foorc'):
              throw { code: 'ENOENT' };
            case absolutePath('a/b/c/d/e/f/.foorc.json'):
              return '{ "found": true,, }';
            default:
              throw new Error(`irrelevant path ${searchPath}`);
          }
        }
        mockReadFile(true, readFile);
        mockReadFile(false, readFile);

        expect.assertions(2);
        expect(() => loadConfig(true)).toThrow(/JSON Error/);
        return loadConfig(false).catch(err => {
          expect(err.message).toMatch(/JSON Error/);
        });
      });

      it('throws error for invalid YAML in .foorc.yml', () => {
        function readFile(searchPath) {
          switch (searchPath) {
            case absolutePath('a/b/c/d/e/f/package.json'):
            case absolutePath('a/b/c/d/e/f/.foorc'):
            case absolutePath('a/b/c/d/e/f/.foorc.json'):
            case absolutePath('a/b/c/d/e/f/.foorc.yaml'):
              throw { code: 'ENOENT' };
            case absolutePath('a/b/c/d/e/f/.foorc.yml'):
              return 'found: thing: true';
            default:
              throw new Error(`irrelevant path ${searchPath}`);
          }
        }
        mockReadFile(true, readFile);
        mockReadFile(false, readFile);

        expect.assertions(2);
        try {
          loadConfig(true);
        } catch (err) {
          expect(err.name).toBe('YAMLException');
        }
        return loadConfig(false).catch(err => {
          expect(err.name).toBe('YAMLException');
        });
      });

      it('throws error for invalid JS in .foorc.js', () => {
        function readFile(searchPath) {
          switch (searchPath) {
            case absolutePath('a/b/c/d/e/f/package.json'):
            case absolutePath('a/b/c/d/e/f/.foorc'):
            case absolutePath('a/b/c/d/e/f/.foorc.json'):
            case absolutePath('a/b/c/d/e/f/.foorc.yaml'):
            case absolutePath('a/b/c/d/e/f/.foorc.yml'):
              throw { code: 'ENOENT' };
            case absolutePath('a/b/c/d/e/f/.foorc.js'):
              return 'module.exports = found: true };';
            default:
              throw new Error(`irrelevant path ${searchPath}`);
          }
        }
        mockReadFile(true, readFile);
        mockReadFile(false, readFile);

        expect.assertions(2);
        try {
          loadConfig(true);
        } catch (err) {
          expect(err.name).toBe('SyntaxError');
        }
        return loadConfig(false).catch(err => {
          expect(err.name).toBe('SyntaxError');
        });
      });
    });
  });
});
