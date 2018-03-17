'use strict';

jest.mock('fs');

const fsMock = require('fs');

const util = require('./util');
const cosmiconfig = require('../src');

const absolutePath = util.absolutePath;
const mockReadFile = util.mockReadFile;

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

describe('gives up if it cannot find the file', () => {
  const startDir = absolutePath('a/b');
  const readFile = searchPath => {
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
  };

  const checkResult = (statMock, readFileMock, result) => {
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
  };

  test('async', () => {
    const readFileMock = mockReadFile(false, readFile);
    return cosmiconfig('foo', {
      stopDir: absolutePath('.'),
    })
      .search(startDir)
      .then(result => {
        checkResult(fsMock.stat, readFileMock, result);
      });
  });

  test('sync', () => {
    const readFileMock = mockReadFile(true, readFile);
    const result = cosmiconfig('foo', {
      stopDir: absolutePath('.'),
      sync: true,
    }).search(startDir);
    checkResult(fsMock.statSync, readFileMock, result);
  });
});

describe('stops at stopDir and gives up', () => {
  const startDir = absolutePath('a/b');
  const readFile = searchPath => {
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
  };

  const checkResult = (readFileMock, result) => {
    util.assertSearchSequence(readFileMock, [
      'a/b/package.json',
      'a/b/.foorc',
      'a/b/foo.config.js',
      'a/package.json',
      'a/.foorc',
      'a/foo.config.js',
    ]);
    expect(result).toBe(null);
  };

  test('async', () => {
    const readFileMock = mockReadFile(false, readFile);
    return cosmiconfig('foo', {
      stopDir: absolutePath('a'),
    })
      .search(startDir)
      .then(result => {
        checkResult(readFileMock, result);
      });
  });

  test('sync', () => {
    const readFileMock = mockReadFile(true, readFile);
    const result = cosmiconfig('foo', {
      stopDir: absolutePath('a'),
      sync: true,
    }).search(startDir);
    checkResult(readFileMock, result);
  });
});

describe('throws error for invalid YAML in rc file', () => {
  const startDir = absolutePath('a/b');
  const readFile = searchPath => {
    switch (searchPath) {
      case absolutePath('a/b/package.json'):
        throw { code: 'ENOENT' };
      case absolutePath('a/b/.foorc'):
        return 'found: true: broken';
      default:
        throw new Error(`irrelevant path ${searchPath}`);
    }
  };

  const checkError = error => {
    expect(error.name).toBe('YAMLException');
  };

  test('async', () => {
    mockReadFile(false, readFile);
    expect.hasAssertions();
    return cosmiconfig('foo', { stopDir: absolutePath('a') })
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    mockReadFile(true, readFile);
    expect.hasAssertions();
    try {
      cosmiconfig('foo', { stopDir: absolutePath('a'), sync: true }).search(
        startDir
      );
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error for invalid JSON in rc file with rcStrictJson', () => {
  const startDir = absolutePath('a/b');
  const readFile = searchPath => {
    switch (searchPath) {
      case absolutePath('a/b/package.json'):
        throw { code: 'ENOENT' };
      case absolutePath('a/b/.foorc'):
        return 'found: true: broken';
      default:
        throw new Error(`irrelevant path ${searchPath}`);
    }
  };

  const checkError = error => {
    expect(error.name).toMatch(/JSONError/);
  };

  test('async', () => {
    mockReadFile(false, readFile);
    expect.hasAssertions();
    return cosmiconfig('foo', {
      rcStrictJson: true,
      stopDir: absolutePath('a'),
    })
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    mockReadFile(true, readFile);
    expect.hasAssertions();
    try {
      cosmiconfig('foo', {
        rcStrictJson: true,
        stopDir: absolutePath('a'),
        sync: true,
      }).search(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error for invalid package.json', () => {
  const startDir = absolutePath('a/b');
  const readFile = searchPath => {
    switch (searchPath) {
      case absolutePath('a/b/package.json'):
        return '{ "foo": "bar", }';
      default:
        throw new Error(`irrelevant path ${searchPath}`);
    }
  };

  const checkError = error => {
    expect(error.name).toMatch(/JSONError/);
  };

  test('async', () => {
    mockReadFile(false, readFile);
    expect.hasAssertions();
    return cosmiconfig('foo', {
      stopDir: absolutePath('a'),
    })
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    mockReadFile(true, readFile);
    expect.hasAssertions();
    try {
      cosmiconfig('foo', {
        stopDir: absolutePath('a'),
        sync: true,
      }).search(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error for invalid JS in .config.js file', () => {
  const startDir = absolutePath('a/b');
  const readFile = searchPath => {
    switch (searchPath) {
      case absolutePath('a/b/package.json'):
      case absolutePath('a/b/.foorc'):
        throw { code: 'ENOENT' };
      case absolutePath('a/b/foo.config.js'):
        return 'module.exports = { found: true: false,';
      default:
        throw new Error(`irrelevant path ${searchPath}`);
    }
  };

  const checkError = error => {
    expect(error.name).toBe('SyntaxError');
  };

  test('async', () => {
    mockReadFile(false, readFile);
    expect.hasAssertions();
    return cosmiconfig('foo', {
      stopDir: absolutePath('a'),
    })
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    mockReadFile(true, readFile);
    expect.hasAssertions();
    try {
      cosmiconfig('foo', {
        stopDir: absolutePath('a'),
        sync: true,
      }).search(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('with rcExtensions, throws error for invalid JSON in .foorc.json', () => {
  const startDir = absolutePath('a/b/c/d/e/f');
  const readFile = searchPath => {
    switch (searchPath) {
      case absolutePath('a/b/c/d/e/f/package.json'):
      case absolutePath('a/b/c/d/e/f/.foorc'):
        throw { code: 'ENOENT' };
      case absolutePath('a/b/c/d/e/f/.foorc.json'):
        return '{ "found": true,, }';
      default:
        throw new Error(`irrelevant path ${searchPath}`);
    }
  };

  const checkError = error => {
    expect(error.message).toMatch(/JSON Error/);
  };

  test('async', () => {
    mockReadFile(false, readFile);
    expect.hasAssertions();
    return cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: absolutePath('.'),
    })
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    mockReadFile(true, readFile);
    expect.hasAssertions();
    try {
      cosmiconfig('foo', {
        rcExtensions: true,
        stopDir: absolutePath('.'),
        sync: true,
      }).search(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('with rcExtensions, throws error for invalid YAML in .foorc.yml', () => {
  const startDir = absolutePath('a/b/c/d/e/f');
  const readFile = searchPath => {
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
  };

  const checkError = error => {
    expect(error.name).toBe('YAMLException');
  };

  test('async', () => {
    mockReadFile(false, readFile);
    expect.hasAssertions();
    return cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: absolutePath('.'),
    })
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    mockReadFile(true, readFile);
    expect.hasAssertions();
    try {
      cosmiconfig('foo', {
        rcExtensions: true,
        stopDir: absolutePath('.'),
        sync: true,
      }).search(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('with rcExtensions, throws error for invalid JS in .foorc.js', () => {
  const startDir = absolutePath('a/b/c/d/e/f');
  const readFile = searchPath => {
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
  };

  const checkError = error => {
    expect(error.name).toBe('SyntaxError');
  };

  test('async', () => {
    mockReadFile(false, readFile);
    expect.hasAssertions();
    return cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: absolutePath('.'),
    })
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    mockReadFile(true, readFile);
    expect.hasAssertions();
    try {
      cosmiconfig('foo', {
        rcExtensions: true,
        stopDir: absolutePath('.'),
        sync: true,
      }).search(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('with ignoreEmpty: false, returns an empty config result for an empty rc file', () => {
  const startDir = absolutePath('a/b');
  const readFile = searchPath => {
    switch (searchPath) {
      case absolutePath('a/b/package.json'):
        throw { code: 'ENOENT' };
      case absolutePath('a/b/.foorc'):
        return '';
      default:
        throw new Error(`irrelevant path ${searchPath}`);
    }
  };

  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: absolutePath('a/b/.foorc'),
      isEmpty: true,
    });
  };

  test('async', () => {
    mockReadFile(false, readFile);
    return cosmiconfig('foo', { stopDir: absolutePath('a') })
      .search(startDir, { ignoreEmpty: false })
      .then(checkResult);
  });

  test('sync', () => {
    mockReadFile(true, readFile);
    const result = cosmiconfig('foo', {
      stopDir: absolutePath('a'),
      sync: true,
    }).search(startDir, { ignoreEmpty: false });
    checkResult(result);
  });
});

describe('with ignoreEmpty: false, returns an empty config result for an empty .config.js file', () => {
  const startDir = absolutePath('a/b');
  const readFile = searchPath => {
    switch (searchPath) {
      case absolutePath('a/b/package.json'):
      case absolutePath('a/b/.foorc'):
        throw { code: 'ENOENT' };
      case absolutePath('a/b/foo.config.js'):
        return '';
      default:
        throw new Error(`irrelevant path ${searchPath}`);
    }
  };

  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: absolutePath('a/b/foo.config.js'),
      isEmpty: true,
    });
  };

  test('async', () => {
    mockReadFile(false, readFile);
    return cosmiconfig('foo', { stopDir: absolutePath('a') })
      .search(startDir, { ignoreEmpty: false })
      .then(checkResult);
  });

  test('sync', () => {
    mockReadFile(true, readFile);
    const result = cosmiconfig('foo', {
      stopDir: absolutePath('a'),
      sync: true,
    }).search(startDir, { ignoreEmpty: false });
    checkResult(result);
  });
});

describe('with ignoreEmtpy and rcExtensions, returns an empty config result for an empty .json rc file', () => {
  const startDir = absolutePath('a/b/c/d/e/f');
  const readFile = searchPath => {
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
  };

  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: absolutePath('a/b/c/d/e/f/.foorc.json'),
      isEmpty: true,
    });
  };

  test('async', () => {
    mockReadFile(false, readFile);
    return cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: absolutePath('a'),
    })
      .search(startDir, { ignoreEmpty: false })
      .then(checkResult);
  });

  test('sync', () => {
    mockReadFile(true, readFile);
    const result = cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: absolutePath('a'),
      sync: true,
    }).search(startDir, { ignoreEmpty: false });
    checkResult(result);
  });
});

describe('with ignoreEmtpy and rcExtensions, returns an empty config result for an empty .yaml rc file', () => {
  const startDir = absolutePath('a/b/c/d/e/f');
  const readFile = searchPath => {
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
  };

  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: absolutePath('a/b/c/d/e/f/.foorc.yaml'),
      isEmpty: true,
    });
  };

  test('async', () => {
    mockReadFile(false, readFile);
    return cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: absolutePath('a'),
    })
      .search(startDir, { ignoreEmpty: false })
      .then(checkResult);
  });

  test('sync', () => {
    mockReadFile(true, readFile);
    const result = cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: absolutePath('a'),
      sync: true,
    }).search(startDir, { ignoreEmpty: false });
    checkResult(result);
  });
});

describe('with ignoreEmtpy and rcExtensions, returns an empty config result for an empty .js rc file', () => {
  const startDir = absolutePath('a/b/c/d/e/f');
  const readFile = searchPath => {
    switch (searchPath) {
      case absolutePath('a/b/c/d/e/f/package.json'):
      case absolutePath('a/b/c/d/e/f/.foorc'):
      case absolutePath('a/b/c/d/e/f/.foorc.json'):
      case absolutePath('a/b/c/d/e/f/.foorc.yml'):
      case absolutePath('a/b/c/d/e/f/.foorc.yaml'):
        throw { code: 'ENOENT' };
      case absolutePath('a/b/c/d/e/f/.foorc.js'):
        return '';
      default:
        throw new Error(`irrelevant path ${searchPath}`);
    }
  };

  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: absolutePath('a/b/c/d/e/f/.foorc.js'),
      isEmpty: true,
    });
  };

  test('async', () => {
    mockReadFile(false, readFile);
    return cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: absolutePath('a'),
    })
      .search(startDir, { ignoreEmpty: false })
      .then(checkResult);
  });

  test('sync', () => {
    mockReadFile(true, readFile);
    const result = cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: absolutePath('a'),
      sync: true,
    }).search(startDir, { ignoreEmpty: false });
    checkResult(result);
  });
});
