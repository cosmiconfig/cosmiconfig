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
  describe('search from directory', () => {
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
      const search = cosmiconfig('foo', {
        stopDir: absolutePath('.'),
        sync,
      }).search;

      expect.hasAssertions();
      return testFuncsRunner(sync, search(startDir), [
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
      const search = cosmiconfig('foo', {
        stopDir: absolutePath('a'),
        sync,
      }).search;

      expect.hasAssertions();
      return testFuncsRunner(sync, search(startDir), [
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

    it('returns an empty config result for empty rc file', () => {
      function readFile(searchPath) {
        switch (searchPath) {
          case absolutePath('a/b/package.json'):
          case absolutePath('a/b/.foorc'):
            return '';
          default:
            throw new Error(`irrelevant path ${searchPath}`);
        }
      }
      mockReadFile(true, readFile);
      mockReadFile(false, readFile);

      const startDir = absolutePath('a/b');
      const search = sync =>
        cosmiconfig('foo', { stopDir: absolutePath('a'), sync }).search(
          startDir,
          { ignoreEmpty: false }
        );
      const expectedResult = {
        config: undefined,
        filepath: absolutePath('a/b/.foorc'),
        isEmpty: true,
      };

      expect.assertions(2);
      expect(search(true)).toEqual(expectedResult);
      return expect(search(false)).resolves.toEqual(expectedResult);
    });

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
      const search = sync =>
        cosmiconfig('foo', { stopDir: absolutePath('a'), sync }).search(
          startDir
        );

      expect.assertions(2);
      try {
        search(true);
      } catch (err) {
        expect(err.name).toBe('YAMLException');
      }
      return search(false).catch(err => {
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
      const search = sync =>
        cosmiconfig('foo', {
          stopDir: absolutePath('a'),
          rcStrictJson: true,
          sync,
        }).search(startDir);

      expect.assertions(2);
      expect(() => search(true)).toThrow(/JSON Error/);
      return search(false).catch(err => {
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
      const search = sync =>
        cosmiconfig('foo', { stopDir: absolutePath('a'), sync }).search(
          startDir
        );

      expect.assertions(2);
      expect(() => search(true)).toThrow(/JSON Error/);
      return search(false).catch(err => {
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
      const search = sync =>
        cosmiconfig('foo', { stopDir: absolutePath('a'), sync }).search(
          startDir
        );

      expect.assertions(2);
      try {
        search(true);
      } catch (err) {
        expect(err.name).toBe('SyntaxError');
      }
      return search(false).catch(err => {
        expect(err.name).toBe('SyntaxError');
      });
    });

    it('returns an empty config result for empty .config.js file', () => {
      function readFile(searchPath) {
        switch (searchPath) {
          case absolutePath('a/b/package.json'):
          case absolutePath('a/b/.foorc'):
            throw { code: 'ENOENT' };
          case absolutePath('a/b/foo.config.js'):
            return '';
          default:
            throw new Error(`irrelevant path ${searchPath}`);
        }
      }
      mockReadFile(true, readFile);
      mockReadFile(false, readFile);

      const startDir = absolutePath('a/b');
      const search = sync =>
        cosmiconfig('foo', { stopDir: absolutePath('a'), sync }).search(
          startDir,
          { ignoreEmpty: false }
        );
      const expectedResult = {
        config: undefined,
        filepath: absolutePath('a/b/foo.config.js'),
        isEmpty: true,
      };

      expect.assertions(2);
      expect(search(true)).toEqual(expectedResult);
      return expect(search(false)).resolves.toEqual(expectedResult);
    });

    describe('with rcExtensions', () => {
      const startDir = absolutePath('a/b/c/d/e/f');
      const search = options => {
        const searchOptions =
          options.ignoreEmpty != null
            ? { ignoreEmpty: options.ignoreEmpty }
            : {};

        return cosmiconfig('foo', {
          stopDir: absolutePath('.'),
          rcExtensions: true,
          sync: options.sync,
        }).search(startDir, searchOptions);
      };
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
        expect(() => search({ sync: true })).toThrow(/JSON Error/);
        return search({ sync: false }).catch(err => {
          expect(err.message).toMatch(/JSON Error/);
        });
      });

      it('throws error for invalid YAML in .foorc.yml', () => {
        function readFile(searchPath) {
          switch (searchPath) {
            case absolutePath('a/b/c/d/e/f/package.json'):
            case absolutePath('a/b/c/d/e/f/.foorc'):
              throw { code: 'ENOENT' };
            case absolutePath('a/b/c/d/e/f/.foorc.json'):
            case absolutePath('a/b/c/d/e/f/.foorc.yaml'):
              return '';
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
          search({ sync: true });
        } catch (err) {
          expect(err.name).toBe('YAMLException');
        }
        return search({ sync: false }).catch(err => {
          expect(err.name).toBe('YAMLException');
        });
      });

      it('throws error for invalid JS in .foorc.js', () => {
        function readFile(searchPath) {
          switch (searchPath) {
            case absolutePath('a/b/c/d/e/f/package.json'):
            case absolutePath('a/b/c/d/e/f/.foorc'):
            case absolutePath('a/b/c/d/e/f/.foorc.json'):
              throw { code: 'ENOENT' };
            case absolutePath('a/b/c/d/e/f/.foorc.yaml'):
            case absolutePath('a/b/c/d/e/f/.foorc.yml'):
              return '';
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
          search({ sync: true });
        } catch (err) {
          expect(err.name).toBe('SyntaxError');
        }
        return search({ sync: false }).catch(err => {
          expect(err.name).toBe('SyntaxError');
        });
      });

      it('returns an empty config result for an empty json', () => {
        function readFile(searchPath) {
          switch (searchPath) {
            case absolutePath('a/b/c/d/e/f/package.json'):
            case absolutePath('a/b/c/d/e/f/.foorc'):
            case absolutePath('a/b/c/d/e/f/.foorc.yaml'):
            case absolutePath('a/b/c/d/e/f/.foorc.yml'):
            case absolutePath('a/b/c/d/e/f/.foorc.js'):
              throw { code: 'ENOENT' };
            case absolutePath('a/b/c/d/e/f/.foorc.json'):
              return '';
            default:
              throw new Error(`irrelevant path ${searchPath}`);
          }
        }
        mockReadFile(true, readFile);
        mockReadFile(false, readFile);

        expect.assertions(2);

        const expectedResult = {
          config: undefined,
          filepath: absolutePath('a/b/c/d/e/f/.foorc.json'),
          isEmpty: true,
        };
        expect(search({ ignoreEmpty: false, sync: true })).toEqual(
          expectedResult
        );
        return expect(
          search({ ignoreEmpty: false, sync: false })
        ).resolves.toEqual(expectedResult);
      });

      it('returns an empty config result for empty yaml', () => {
        function readFile(searchPath) {
          switch (searchPath) {
            case absolutePath('a/b/c/d/e/f/package.json'):
            case absolutePath('a/b/c/d/e/f/.foorc'):
            case absolutePath('a/b/c/d/e/f/.foorc.json'):
            case absolutePath('a/b/c/d/e/f/.foorc.yml'):
            case absolutePath('a/b/c/d/e/f/.foorc.js'):
              throw { code: 'ENOENT' };
            case absolutePath('a/b/c/d/e/f/.foorc.yaml'):
              return '';
            default:
              throw new Error(`irrelevant path ${searchPath}`);
          }
        }
        mockReadFile(true, readFile);
        mockReadFile(false, readFile);

        expect.assertions(2);

        const expectedResult = {
          config: undefined,
          filepath: absolutePath('a/b/c/d/e/f/.foorc.yaml'),
          isEmpty: true,
        };
        expect(search({ ignoreEmpty: false, sync: true })).toEqual(
          expectedResult
        );
        return expect(
          search({ ignoreEmpty: false, sync: false })
        ).resolves.toEqual(expectedResult);
      });

      it('returns an empty config result for empty js', () => {
        function readFile(searchPath) {
          switch (searchPath) {
            case absolutePath('a/b/c/d/e/f/package.json'):
            case absolutePath('a/b/c/d/e/f/.foorc'):
            case absolutePath('a/b/c/d/e/f/.foorc.json'):
            case absolutePath('a/b/c/d/e/f/.foorc.yaml'):
            case absolutePath('a/b/c/d/e/f/.foorc.yml'):
              throw { code: 'ENOENT' };
            case absolutePath('a/b/c/d/e/f/.foorc.js'):
              return '';
            default:
              throw new Error(`irrelevant path ${searchPath}`);
          }
        }
        mockReadFile(true, readFile);
        mockReadFile(false, readFile);

        expect.assertions(2);

        const expectedResult = {
          config: undefined,
          filepath: absolutePath('a/b/c/d/e/f/.foorc.js'),
          isEmpty: true,
        };
        expect(search({ ignoreEmpty: false, sync: true })).toEqual(
          expectedResult
        );
        return expect(
          search({ ignoreEmpty: false, sync: false })
        ).resolves.toEqual(expectedResult);
      });
    });
  });
});
