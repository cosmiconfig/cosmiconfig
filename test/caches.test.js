'use strict';

jest.mock('fs');

const fsMock = require('fs');

const util = require('./util');
const cosmiconfig = require('../src');

const absolutePath = util.absolutePath;
const mockStatIsDirectory = util.mockStatIsDirectory;

beforeAll(() => {
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
        return '{ "foundInD": true }';
      case absolutePath('a/b/c/d/foo.config.js'):
      case absolutePath('a/b/c/package.json'):
      case absolutePath('a/b/c/.foorc'):
      case absolutePath('a/b/c/foo.config.js'):
        throw { code: 'ENOENT' };
      case absolutePath('a/b/package.json'):
        return '{ "foo": { "foundInB": true } }';
      default:
        throw new Error(`irrelevant path ${searchPath}`);
    }
  }

  jest
    .spyOn(fsMock, 'readFile')
    .mockImplementation(util.makeReadFileMockImpl(readFile));
  jest.spyOn(fsMock, 'readFileSync').mockImplementation(readFile);
});

function resetReadFileMocks() {
  fsMock.readFile.mockClear();
  fsMock.readFileSync.mockClear();
}

function resetFsMocks() {
  fsMock.stat.mockReset();
  fsMock.statSync.mockReset();
  resetReadFileMocks();
}

afterEach(() => {
  resetFsMocks();
});

afterAll(() => {
  jest.resetAllMocks();
});

describe('cache is not used initially', () => {
  const searchPath = absolutePath('a/b/c/d/e');
  const checkResult = (readFileMock, result) => {
    util.assertSearchSequence(readFileMock, [
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/foo.config.js',
      'a/b/c/d/package.json',
      'a/b/c/d/.foorc',
    ]);
    expect(result).toEqual({
      filepath: absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    mockStatIsDirectory(true);
    const cachedSearch = cosmiconfig('foo').search;
    return cachedSearch(searchPath).then(result => {
      checkResult(fsMock.readFile, result);
    });
  });

  test('sync', () => {
    mockStatIsDirectory(true);
    const cachedSearchSync = cosmiconfig('foo', { sync: true }).search;
    const result = cachedSearchSync(searchPath);
    checkResult(fsMock.readFileSync, result);
  });
});

describe('cache is used for already-visited directories', () => {
  const searchPath = absolutePath('a/b/c/d/e');
  const checkResult = (readFileMock, result) => {
    expect(readFileMock).toHaveBeenCalledTimes(0);
    expect(result).toEqual({
      filepath: absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    mockStatIsDirectory(true);
    const cachedSearch = cosmiconfig('foo').search;
    // First pass, prime the cache ...
    return cachedSearch(searchPath)
      .then(() => {
        // Reset readFile mocks and search again.
        resetReadFileMocks();
        return cachedSearch(searchPath);
      })
      .then(result => {
        checkResult(fsMock.readFile, result);
      });
  });

  test('sync', () => {
    mockStatIsDirectory(true);
    const cachedSearchSync = cosmiconfig('foo', { sync: true }).search;
    // First pass, prime the cache ...
    cachedSearchSync(searchPath);
    // Reset readFile mocks and search again.
    resetReadFileMocks();
    const result = cachedSearchSync(searchPath);
    checkResult(fsMock.readFileSync, result);
  });
});

describe('cache is used when some directories in search are already visted', () => {
  const firstSearchPath = absolutePath('a/b/c/d/e');
  const secondSearchPath = absolutePath('a/b/c/d/e/f');
  const checkResult = (readFileMock, result) => {
    util.assertSearchSequence(readFileMock, [
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/foo.config.js',
    ]);
    expect(result).toEqual({
      filepath: absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    mockStatIsDirectory(true);
    const cachedSearch = cosmiconfig('foo').search;
    // First pass, prime the cache ...
    return cachedSearch(firstSearchPath)
      .then(() => {
        // Reset readFile mocks and search again.
        resetReadFileMocks();
        return cachedSearch(secondSearchPath);
      })
      .then(result => {
        checkResult(fsMock.readFile, result);
      });
  });

  test('sync', () => {
    mockStatIsDirectory(true);
    const cachedSearchSync = cosmiconfig('foo', { sync: true }).search;
    // First pass, prime the cache ...
    cachedSearchSync(firstSearchPath);
    // Reset readFile mocks and search again.
    resetReadFileMocks();
    const result = cachedSearchSync(secondSearchPath);
    checkResult(fsMock.readFileSync, result);
  });
});

describe('cache is not used when directly loading an unvisited file', () => {
  const firstSearchPath = absolutePath('a/b/c/d/e');
  const loadPath = absolutePath('a/b/package.json');
  const checkResult = (readFileMock, result) => {
    expect(readFileMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      filepath: absolutePath('a/b/package.json'),
      config: { foundInB: true },
    });
  };

  test('async', () => {
    mockStatIsDirectory(true);
    const explorer = cosmiconfig('foo');
    // First pass, prime the cache ...
    return explorer
      .search(firstSearchPath)
      .then(() => {
        // Reset readFile mocks and search again.
        resetReadFileMocks();
        mockStatIsDirectory(false);
        return explorer.load(loadPath);
      })
      .then(result => {
        checkResult(fsMock.readFile, result);
      });
  });

  test('sync', () => {
    mockStatIsDirectory(true);
    const explorer = cosmiconfig('foo', { sync: true });
    // First pass, prime the cache ...
    explorer.search(firstSearchPath);
    // Reset readFile mocks and search again.
    resetReadFileMocks();
    mockStatIsDirectory(false);
    const result = explorer.load(loadPath);
    checkResult(fsMock.readFileSync, result);
  });
});

describe('cache is not used in a new cosmiconfig instance', () => {
  const searchPath = absolutePath('a/b/c/d/e');
  const checkResult = (readFileMock, result) => {
    util.assertSearchSequence(readFileMock, [
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/foo.config.js',
      'a/b/c/d/package.json',
      'a/b/c/d/.foorc',
    ]);
    expect(result).toEqual({
      filepath: absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    mockStatIsDirectory(true);
    return cosmiconfig('foo')
      .search(searchPath)
      .then(() => {
        // Reset readFile mocks and search again.
        resetReadFileMocks();
        return cosmiconfig('foo').search(searchPath);
      })
      .then(result => {
        checkResult(fsMock.readFile, result);
      });
  });

  test('sync', () => {
    mockStatIsDirectory(true);
    cosmiconfig('foo', { sync: true }).search(searchPath);
    // Reset readFile mocks and search again.
    resetReadFileMocks();
    const result = cosmiconfig('foo', { sync: true }).search(searchPath);
    checkResult(fsMock.readFileSync, result);
  });
});

describe('clears file cache on calling clearLoadCache', () => {
  const loadPath = absolutePath('a/b/c/d/.foorc');
  const checkResult = (readFileMock, result) => {
    util.assertSearchSequence(readFileMock, ['a/b/c/d/.foorc']);
    expect(result).toEqual({
      filepath: absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    mockStatIsDirectory(false);
    const explorer = cosmiconfig('foo');
    return explorer
      .load(loadPath)
      .then(() => {
        // Reset readFile mocks and search again.
        resetReadFileMocks();
        explorer.clearLoadCache();
        return explorer.load(loadPath);
      })
      .then(result => {
        checkResult(fsMock.readFile, result);
      });
  });

  test('sync', () => {
    mockStatIsDirectory(false);
    const explorer = cosmiconfig('foo', { sync: true });
    explorer.load(loadPath);
    // Reset readFile mocks and search again.
    resetReadFileMocks();
    explorer.clearLoadCache();
    const result = explorer.load(loadPath);
    checkResult(fsMock.readFileSync, result);
  });
});

describe('clears file cache on calling clearCaches', () => {
  const loadPath = absolutePath('a/b/c/d/.foorc');
  const checkResult = (readFileMock, result) => {
    util.assertSearchSequence(readFileMock, ['a/b/c/d/.foorc']);
    expect(result).toEqual({
      filepath: absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    mockStatIsDirectory(false);
    const explorer = cosmiconfig('foo');
    return explorer
      .load(loadPath)
      .then(() => {
        // Reset readFile mocks and search again.
        resetReadFileMocks();
        explorer.clearCaches();
        return explorer.load(loadPath);
      })
      .then(result => {
        checkResult(fsMock.readFile, result);
      });
  });

  test('sync', () => {
    mockStatIsDirectory(false);
    const explorer = cosmiconfig('foo', { sync: true });
    explorer.load(loadPath);
    // Reset readFile mocks and search again.
    resetReadFileMocks();
    explorer.clearCaches();
    const result = explorer.load(loadPath);
    checkResult(fsMock.readFileSync, result);
  });
});

describe('clears directory cache on calling clearSearchCache', () => {
  const searchPath = absolutePath('a/b/c/d/e');
  const checkResult = (readFileMock, result) => {
    util.assertSearchSequence(readFileMock, [
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/foo.config.js',
      'a/b/c/d/package.json',
      'a/b/c/d/.foorc',
    ]);
    expect(result).toEqual({
      filepath: absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    mockStatIsDirectory(true);
    const explorer = cosmiconfig('foo');
    return explorer
      .search(searchPath)
      .then(() => {
        // Reset readFile mocks and search again.
        resetReadFileMocks();
        explorer.clearSearchCache();
        return explorer.search(searchPath);
      })
      .then(result => {
        checkResult(fsMock.readFile, result);
      });
  });

  test('sync', () => {
    mockStatIsDirectory(true);
    const explorer = cosmiconfig('foo', { sync: true });
    explorer.search(searchPath);
    // Reset readFile mocks and search again.
    resetReadFileMocks();
    explorer.clearSearchCache();
    const result = explorer.search(searchPath);
    checkResult(fsMock.readFileSync, result);
  });
});

describe('clears directory cache on calling clearCaches', () => {
  const searchPath = absolutePath('a/b/c/d/e');
  const checkResult = (readFileMock, result) => {
    util.assertSearchSequence(readFileMock, [
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/foo.config.js',
      'a/b/c/d/package.json',
      'a/b/c/d/.foorc',
    ]);
    expect(result).toEqual({
      filepath: absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    mockStatIsDirectory(true);
    const explorer = cosmiconfig('foo');
    return explorer
      .search(searchPath)
      .then(() => {
        // Reset readFile mocks and search again.
        resetReadFileMocks();
        explorer.clearCaches();
        return explorer.search(searchPath);
      })
      .then(result => {
        checkResult(fsMock.readFile, result);
      });
  });

  test('sync', () => {
    mockStatIsDirectory(true);
    const explorer = cosmiconfig('foo', { sync: true });
    explorer.search(searchPath);
    // Reset readFile mocks and search again.
    resetReadFileMocks();
    explorer.clearCaches();
    const result = explorer.search(searchPath);
    checkResult(fsMock.readFileSync, result);
  });
});

describe('with cache disabled', () => {
  const explorer = cosmiconfig('foo', { cache: false });

  test('does not throw an error when clearFileCache is called', () => {
    expect(() => explorer.clearLoadCache()).not.toThrow();
  });

  test('does not throw an error when clearDirectoryCache is called', () => {
    expect(() => explorer.clearSearchCache()).not.toThrow();
  });

  test('does not throw an error when clearCaches is called', () => {
    expect(() => explorer.clearCaches()).not.toThrow();
  });
});

describe('with cache disabled, does not cache directory results', () => {
  const searchPath = absolutePath('a/b/c/d/e');
  const checkResult = (readFileMock, result) => {
    util.assertSearchSequence(readFileMock, [
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/foo.config.js',
      'a/b/c/d/package.json',
      'a/b/c/d/.foorc',
    ]);
    expect(result).toEqual({
      filepath: absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    mockStatIsDirectory(true);
    const explorer = cosmiconfig('foo', { cache: false });
    return explorer
      .search(searchPath)
      .then(() => {
        // Reset readFile mocks and search again.
        resetReadFileMocks();
        return explorer.search(searchPath);
      })
      .then(result => {
        checkResult(fsMock.readFile, result);
      });
  });

  test('sync', () => {
    mockStatIsDirectory(true);
    const explorer = cosmiconfig('foo', { cache: false, sync: true });
    explorer.search(searchPath);
    // Reset readFile mocks and search again.
    resetReadFileMocks();
    const result = explorer.search(searchPath);
    checkResult(fsMock.readFileSync, result);
  });
});

describe('with cache disabled, does not cache file results', () => {
  const loadPath = absolutePath('a/b/c/d/.foorc');
  const checkResult = (readFileMock, result) => {
    util.assertSearchSequence(readFileMock, ['a/b/c/d/.foorc']);
    expect(result).toEqual({
      filepath: absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    mockStatIsDirectory(false);
    const explorer = cosmiconfig('foo', { cache: false });
    return explorer
      .load(loadPath)
      .then(() => {
        // Reset readFile mocks and search again.
        resetReadFileMocks();
        return explorer.load(loadPath);
      })
      .then(result => {
        checkResult(fsMock.readFile, result);
      });
  });

  test('sync', () => {
    mockStatIsDirectory(false);
    const explorer = cosmiconfig('foo', { cache: false, sync: true });
    explorer.load(loadPath);
    // Reset readFile mocks and search again.
    resetReadFileMocks();
    const result = explorer.load(loadPath);
    checkResult(fsMock.readFileSync, result);
  });
});
