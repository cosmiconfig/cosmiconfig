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

describe('finds rc file in third searched dir, with a package.json lacking prop', () => {
  const startDir = absolutePath('a/b/c/d/e/f');
  const readFile = searchPath => {
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
  };

  const checkResult = (readFileMock, result) => {
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
  };

  test('async', () => {
    const readFileMock = mockReadFile(false, readFile);
    return cosmiconfig('foo', { stopDir: absolutePath('.') })
      .search(startDir)
      .then(result => {
        checkResult(readFileMock, result);
      });
  });

  test('sync', () => {
    const readFileMock = mockReadFile(true, readFile);
    const result = cosmiconfig('foo', {
      stopDir: absolutePath('.'),
      sync: true,
    }).search(startDir);
    checkResult(readFileMock, result);
  });
});

describe('finds package.json prop in second searched dir', () => {
  const startDir = absolutePath('a/b/c/d/e/f');
  const readFile = searchPath => {
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
  };

  const checkResult = (readFileMock, result) => {
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
  };

  test('async', () => {
    const readFileMock = mockReadFile(false, readFile);
    return cosmiconfig('foo', { stopDir: absolutePath('.') })
      .search(startDir)
      .then(result => {
        checkResult(readFileMock, result);
      });
  });

  test('sync', () => {
    const readFileMock = mockReadFile(true, readFile);
    const result = cosmiconfig('foo', {
      stopDir: absolutePath('.'),
      sync: true,
    }).search(startDir);
    checkResult(readFileMock, result);
  });
});

describe('finds JS file in first searched dir', () => {
  const startDir = absolutePath('a/b/c/d/e/f');
  const readFile = searchPath => {
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
  };

  const checkResult = (readFileMock, result) => {
    util.assertSearchSequence(readFileMock, [
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/foo.config.js',
    ]);

    expect(result).toEqual({
      config: { found: true },
      filepath: absolutePath('a/b/c/d/e/f/foo.config.js'),
    });
  };

  test('async', () => {
    const readFileMock = mockReadFile(false, readFile);
    return cosmiconfig('foo', { stopDir: absolutePath('.') })
      .search(startDir)
      .then(result => {
        checkResult(readFileMock, result);
      });
  });

  test('sync', () => {
    const readFileMock = mockReadFile(true, readFile);
    const result = cosmiconfig('foo', {
      stopDir: absolutePath('.'),
      sync: true,
    }).search(startDir);
    checkResult(readFileMock, result);
  });
});

describe('finds package.json in second dir searched, with alternate names', () => {
  const startDir = absolutePath('a/b/c/d/e/f');
  const readFile = searchPath => {
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
  };

  const checkResult = (readFileMock, result) => {
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
  };

  test('async', () => {
    const readFileMock = mockReadFile(false, readFile);
    return cosmiconfig('foo', {
      rc: '.wowza',
      js: 'wowzaConfig.js',
      packageProp: 'heeha',
      stopDir: absolutePath('.'),
    })
      .search(startDir)
      .then(result => {
        checkResult(readFileMock, result);
      });
  });

  test('sync', () => {
    const readFileMock = mockReadFile(true, readFile);
    const result = cosmiconfig('foo', {
      rc: '.wowza',
      js: 'wowzaConfig.js',
      packageProp: 'heeha',
      stopDir: absolutePath('.'),
      sync: true,
    }).search(startDir);
    checkResult(readFileMock, result);
  });
});

describe('finds rc file in third searched dir, skipping packageProp, with rcStrictJson', () => {
  const startDir = absolutePath('a/b/c/d/e/f');
  const readFile = searchPath => {
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
  };

  const checkResult = (readFileMock, result) => {
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
  };

  test('async', () => {
    const readFileMock = mockReadFile(false, readFile);
    return cosmiconfig('foo', {
      packageProp: false,
      rcStrictJson: true,
      stopDir: absolutePath('.'),
    })
      .search(startDir)
      .then(result => {
        checkResult(readFileMock, result);
      });
  });

  test('sync', () => {
    const readFileMock = mockReadFile(true, readFile);
    const result = cosmiconfig('foo', {
      packageProp: false,
      rcStrictJson: true,
      stopDir: absolutePath('.'),
      sync: true,
    }).search(startDir);
    checkResult(readFileMock, result);
  });
});

describe('finds rc file in third searched dir, skipping JS and RC files, with rcStrictJson', () => {
  const startDir = absolutePath('a/b/c/d/e/f');
  const readFile = searchPath => {
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
  };

  const checkResult = (readFileMock, result) => {
    util.assertSearchSequence(readFileMock, [
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/package.json',
    ]);

    expect(result).toEqual({
      config: { found: true },
      filepath: absolutePath('a/b/c/d/e/package.json'),
    });
  };

  test('async', () => {
    const readFileMock = mockReadFile(false, readFile);
    return cosmiconfig('foo', {
      js: false,
      rc: false,
      stopDir: absolutePath('.'),
    })
      .search(startDir)
      .then(result => {
        checkResult(readFileMock, result);
      });
  });

  test('sync', () => {
    const readFileMock = mockReadFile(true, readFile);
    const result = cosmiconfig('foo', {
      js: false,
      rc: false,
      stopDir: absolutePath('.'),
      sync: true,
    }).search(startDir);
    checkResult(readFileMock, result);
  });
});

describe('with rcExtensions, finds .foorc.json in second searched dir', () => {
  const startDir = absolutePath('a/b/c/d/e/f');
  const readFile = searchPath => {
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
  };

  const checkResult = (readFileMock, result) => {
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
  };

  test('async', () => {
    const readFileMock = mockReadFile(false, readFile);
    return cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: absolutePath('.'),
    })
      .search(startDir)
      .then(result => {
        checkResult(readFileMock, result);
      });
  });

  test('sync', () => {
    const readFileMock = mockReadFile(true, readFile);
    const result = cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: absolutePath('.'),
      sync: true,
    }).search(startDir);
    checkResult(readFileMock, result);
  });
});

describe('with rcExtensions, finds .foorc.yaml in first searched dir', () => {
  const startDir = absolutePath('a/b/c/d/e/f');
  const readFile = searchPath => {
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
  };

  const checkResult = (readFileMock, result) => {
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
  };

  test('async', () => {
    const readFileMock = mockReadFile(false, readFile);
    return cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: absolutePath('.'),
    })
      .search(startDir)
      .then(result => {
        checkResult(readFileMock, result);
      });
  });

  test('sync', () => {
    const readFileMock = mockReadFile(true, readFile);
    const result = cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: absolutePath('.'),
      sync: true,
    }).search(startDir);
    checkResult(readFileMock, result);
  });
});

describe('with rcExtensions, finds .foorc.yml in first searched dir', () => {
  const startDir = absolutePath('a/b/c/d/e/f');
  const readFile = searchPath => {
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
  };

  const checkResult = (readFileMock, result) => {
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
  };

  test('async', () => {
    const readFileMock = mockReadFile(false, readFile);
    return cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: absolutePath('.'),
    })
      .search(startDir)
      .then(result => {
        checkResult(readFileMock, result);
      });
  });

  test('sync', () => {
    const readFileMock = mockReadFile(true, readFile);
    const result = cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: absolutePath('.'),
      sync: true,
    }).search(startDir);
    checkResult(readFileMock, result);
  });
});

describe('with rcExtensions, finds .foorc.js in first searched dir', () => {
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
        return 'module.exports = { found: true };';
      default:
        throw new Error(`irrelevant path ${searchPath}`);
    }
  };

  const checkResult = (readFileMock, result) => {
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
  };

  test('async', () => {
    const readFileMock = mockReadFile(false, readFile);
    return cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: absolutePath('.'),
    })
      .search(startDir)
      .then(result => {
        checkResult(readFileMock, result);
      });
  });

  test('sync', () => {
    const readFileMock = mockReadFile(true, readFile);
    const result = cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: absolutePath('.'),
      sync: true,
    }).search(startDir);
    checkResult(readFileMock, result);
  });
});
