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
    const cachedLoadConfig = cosmiconfig('foo').load;
    return cachedLoadConfig(searchPath).then(result => {
      checkResult(fsMock.readFile, result);
    });
  });

  test('sync', () => {
    mockStatIsDirectory(true);
    const cachedLoadConfigSync = cosmiconfig('foo', { sync: true }).load;
    const result = cachedLoadConfigSync(searchPath);
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
    const cachedLoadConfig = cosmiconfig('foo').load;
    // First pass, prime the cache ...
    return cachedLoadConfig(searchPath)
      .then(() => {
        // Reset readFile mocks and search again.
        resetReadFileMocks();
        return cachedLoadConfig(searchPath);
      })
      .then(result => {
        checkResult(fsMock.readFile, result);
      });
  });

  test('sync', () => {
    mockStatIsDirectory(true);
    const cachedLoadConfigSync = cosmiconfig('foo', { sync: true }).load;
    // First pass, prime the cache ...
    cachedLoadConfigSync(searchPath);
    // Reset readFile mocks and search again.
    resetReadFileMocks();
    const result = cachedLoadConfigSync(searchPath);
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
    const cachedLoadConfig = cosmiconfig('foo').load;
    // First pass, prime the cache ...
    return cachedLoadConfig(firstSearchPath)
      .then(() => {
        // Reset readFile mocks and search again.
        resetReadFileMocks();
        return cachedLoadConfig(secondSearchPath);
      })
      .then(result => {
        checkResult(fsMock.readFile, result);
      });
  });

  test('sync', () => {
    mockStatIsDirectory(true);
    const cachedLoadConfigSync = cosmiconfig('foo', { sync: true }).load;
    // First pass, prime the cache ...
    cachedLoadConfigSync(firstSearchPath);
    // Reset readFile mocks and search again.
    resetReadFileMocks();
    const result = cachedLoadConfigSync(secondSearchPath);
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
    const cachedLoadConfig = cosmiconfig('foo').load;
    // First pass, prime the cache ...
    return cachedLoadConfig(firstSearchPath)
      .then(() => {
        // Reset readFile mocks and search again.
        resetReadFileMocks();
        mockStatIsDirectory(false);
        return cachedLoadConfig(null, loadPath);
      })
      .then(result => {
        checkResult(fsMock.readFile, result);
      });
  });

  test('sync', () => {
    mockStatIsDirectory(true);
    const cachedLoadConfigSync = cosmiconfig('foo', { sync: true }).load;
    // First pass, prime the cache ...
    cachedLoadConfigSync(firstSearchPath);
    // Reset readFile mocks and search again.
    resetReadFileMocks();
    mockStatIsDirectory(false);
    const result = cachedLoadConfigSync(null, loadPath);
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
      .load(searchPath)
      .then(() => {
        // Reset readFile mocks and search again.
        resetReadFileMocks();
        return cosmiconfig('foo').load(searchPath);
      })
      .then(result => {
        checkResult(fsMock.readFile, result);
      });
  });

  test('sync', () => {
    mockStatIsDirectory(true);
    cosmiconfig('foo', { sync: true }).load(searchPath);
    // Reset readFile mocks and search again.
    resetReadFileMocks();
    const result = cosmiconfig('foo', { sync: true }).load(searchPath);
    checkResult(fsMock.readFileSync, result);
  });
});

describe('clears file cache on calling clearFileCache', () => {
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
      .load(null, loadPath)
      .then(() => {
        // Reset readFile mocks and search again.
        resetReadFileMocks();
        explorer.clearFileCache();
        return explorer.load(null, loadPath);
      })
      .then(result => {
        checkResult(fsMock.readFile, result);
      });
  });

  test('sync', () => {
    mockStatIsDirectory(false);
    const explorer = cosmiconfig('foo', { sync: true });
    explorer.load(null, loadPath);
    // Reset readFile mocks and search again.
    resetReadFileMocks();
    explorer.clearFileCache();
    const result = explorer.load(null, loadPath);
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
      .load(null, loadPath)
      .then(() => {
        // Reset readFile mocks and search again.
        resetReadFileMocks();
        explorer.clearCaches();
        return explorer.load(null, loadPath);
      })
      .then(result => {
        checkResult(fsMock.readFile, result);
      });
  });

  test('sync', () => {
    mockStatIsDirectory(false);
    const explorer = cosmiconfig('foo', { sync: true });
    explorer.load(null, loadPath);
    // Reset readFile mocks and search again.
    resetReadFileMocks();
    explorer.clearCaches();
    const result = explorer.load(null, loadPath);
    checkResult(fsMock.readFileSync, result);
  });
});

describe('clears directory cache on calling clearDirectoryCache', () => {
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
      .load(searchPath)
      .then(() => {
        // Reset readFile mocks and search again.
        resetReadFileMocks();
        explorer.clearDirectoryCache();
        return explorer.load(searchPath);
      })
      .then(result => {
        checkResult(fsMock.readFile, result);
      });
  });

  test('sync', () => {
    mockStatIsDirectory(true);
    const explorer = cosmiconfig('foo', { sync: true });
    explorer.load(searchPath);
    // Reset readFile mocks and search again.
    resetReadFileMocks();
    explorer.clearDirectoryCache();
    const result = explorer.load(searchPath);
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
      .load(searchPath)
      .then(() => {
        // Reset readFile mocks and search again.
        resetReadFileMocks();
        explorer.clearCaches();
        return explorer.load(searchPath);
      })
      .then(result => {
        checkResult(fsMock.readFile, result);
      });
  });

  test('sync', () => {
    mockStatIsDirectory(true);
    const explorer = cosmiconfig('foo', { sync: true });
    explorer.load(searchPath);
    // Reset readFile mocks and search again.
    resetReadFileMocks();
    explorer.clearCaches();
    const result = explorer.load(searchPath);
    checkResult(fsMock.readFileSync, result);
  });
});

describe('with cache disabled', () => {
  const explorer = cosmiconfig('foo', { cache: false });

  test('does not throw an error when clearFileCache is called', () => {
    expect(() => explorer.clearFileCache()).not.toThrow();
  });

  test('does not throw an error when clearDirectoryCache is called', () => {
    expect(() => explorer.clearDirectoryCache()).not.toThrow();
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
      .load(searchPath)
      .then(() => {
        // Reset readFile mocks and search again.
        resetReadFileMocks();
        return explorer.load(searchPath);
      })
      .then(result => {
        checkResult(fsMock.readFile, result);
      });
  });

  test('sync', () => {
    mockStatIsDirectory(true);
    const explorer = cosmiconfig('foo', { cache: false, sync: true });
    explorer.load(searchPath);
    // Reset readFile mocks and search again.
    resetReadFileMocks();
    const result = explorer.load(searchPath);
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
      .load(null, loadPath)
      .then(() => {
        // Reset readFile mocks and search again.
        resetReadFileMocks();
        return explorer.load(null, loadPath);
      })
      .then(result => {
        checkResult(fsMock.readFile, result);
      });
  });

  test('sync', () => {
    mockStatIsDirectory(false);
    const explorer = cosmiconfig('foo', { cache: false, sync: true });
    explorer.load(null, loadPath);
    // Reset readFile mocks and search again.
    resetReadFileMocks();
    const result = explorer.load(null, loadPath);
    checkResult(fsMock.readFileSync, result);
  });
});
