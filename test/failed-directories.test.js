'use strict';

const fs = require('fs');
const cosmiconfig = require('../src');
const util = require('./util');

const temp = new util.TempDir();

beforeEach(() => {
  temp.clean();
  temp.createDir('a/b/c/d/e/f/');
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(() => {
  // Remove temp.dir created for tests
  temp.deleteTempDir();
});

describe('gives up if it cannot find the file', () => {
  const startDir = temp.absolutePath('a/b');
  const explorerOptions = { stopDir: temp.absolutePath('.') };

  const checkResult = (statSpy, readFileSpy, result) => {
    const statPath = temp.getSpyPathCalls(statSpy);
    expect(statPath).toEqual(['a/b']);

    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
      'a/b/package.json',
      'a/b/.foorc',
      'a/b/.foorc.json',
      'a/b/.foorc.yaml',
      'a/b/.foorc.yml',
      'a/b/.foorc.js',
      'a/b/foo.config.js',
      'a/package.json',
      'a/.foorc',
      'a/.foorc.json',
      'a/.foorc.yaml',
      'a/.foorc.yml',
      'a/.foorc.js',
      'a/foo.config.js',
      'package.json',
      '.foorc',
      '.foorc.json',
      '.foorc.yaml',
      '.foorc.yml',
      '.foorc.js',
      'foo.config.js',
    ]);

    expect(result).toBe(null);
  };

  test('async', () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const statSpy = jest.spyOn(fs, 'stat');
    return cosmiconfig('foo', explorerOptions)
      .search(startDir)
      .then(result => {
        checkResult(statSpy, readFileSpy, result);
      });
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const statSpy = jest.spyOn(fs, 'statSync');
    const result = cosmiconfig('foo', explorerOptions).searchSync(startDir);
    checkResult(statSpy, readFileSpy, result);
  });
});

describe('stops at stopDir and gives up', () => {
  const startDir = temp.absolutePath('a/b');
  const explorerOptions = { stopDir: temp.absolutePath('a') };

  const checkResult = (readFileSpy, result) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
      'a/b/package.json',
      'a/b/.foorc',
      'a/b/.foorc.json',
      'a/b/.foorc.yaml',
      'a/b/.foorc.yml',
      'a/b/.foorc.js',
      'a/b/foo.config.js',
      'a/package.json',
      'a/.foorc',
      'a/.foorc.json',
      'a/.foorc.yaml',
      'a/.foorc.yml',
      'a/.foorc.js',
      'a/foo.config.js',
    ]);

    expect(result).toBe(null);
  };

  test('async', () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    return cosmiconfig('foo', explorerOptions)
      .search(startDir)
      .then(result => {
        checkResult(readFileSpy, result);
      });
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const result = cosmiconfig('foo', explorerOptions).searchSync(startDir);
    checkResult(readFileSpy, result);
  });
});

describe('throws error for invalid YAML in rc file', () => {
  beforeEach(() => {
    temp.createFile('a/b/.foorc', 'found: true: broken');
  });

  const startDir = temp.absolutePath('a/b');
  const explorerOptions = { stopDir: temp.absolutePath('a') };

  const checkError = error => {
    expect(error.name).toBe('YAMLException');
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('foo', explorerOptions)
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('foo', explorerOptions).searchSync(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error for invalid JSON in extensionless rc file loaded as JSON', () => {
  beforeEach(() => {
    temp.createFile('a/b/.foorc', 'found: true: broken');
  });

  const startDir = temp.absolutePath('a/b');
  const explorerOptions = {
    stopDir: temp.absolutePath('a'),
    loaders: {
      noExt: cosmiconfig.loadJson,
    },
  };

  const checkError = error => {
    expect(error.name).toMatch(/JSONError/);
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('foo', explorerOptions)
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('foo', explorerOptions).searchSync(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error for invalid package.json', () => {
  beforeEach(() => {
    temp.createFile('a/b/package.json', '{ "foo": "bar", }');
  });

  const startDir = temp.absolutePath('a/b');
  const explorerOptions = { stopDir: temp.absolutePath('a') };

  const checkError = error => {
    expect(error.name).toMatch(/JSONError/);
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('foo', explorerOptions)
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('foo', explorerOptions).searchSync(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error for invalid JS in .config.js file', () => {
  beforeEach(() => {
    temp.createFile(
      'a/b/foo.config.js',
      'module.exports = { found: true: false,'
    );
  });

  const startDir = temp.absolutePath('a/b');
  const explorerOptions = { stopDir: temp.absolutePath('a') };

  const checkError = error => {
    expect(error.name).toBe('SyntaxError');
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('foo', explorerOptions)
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('foo', explorerOptions).searchSync(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error for invalid JSON in .foorc.json', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.json', '{ "found": true,, }');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
  };

  const checkError = error => {
    expect(error.message).toMatch(/JSON Error/);
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('foo', explorerOptions)
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('foo', explorerOptions).searchSync(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error for invalid YAML in .foorc.yml', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.yml', 'found: thing: true');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
  };

  const checkError = error => {
    expect(error.name).toBe('YAMLException');
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('foo', explorerOptions)
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('foo', explorerOptions).searchSync(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('searching for rc files with specified extensions, throws error for invalid JS in .foorc.js', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.js', 'module.exports = found: true };');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: [
      'package.json',
      '.foorc',
      '.foorc.json',
      '.foorc.yaml',
      '.foorc.yml',
      '.foorc.js',
      'foo.config.js',
    ],
  };

  const checkError = error => {
    expect(error.name).toBe('SyntaxError');
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('foo', explorerOptions)
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('foo', explorerOptions).searchSync(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('without ignoring empty files, returns an empty config result for an empty rc file', () => {
  beforeEach(() => {
    temp.createFile('a/b/.foorc', '');
  });

  const startDir = temp.absolutePath('a/b');
  const explorerOptions = {
    stopDir: temp.absolutePath('a'),
    ignoreEmptySearchPlaces: false,
  };

  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: temp.absolutePath('a/b/.foorc'),
      isEmpty: true,
    });
  };

  test('async', () => {
    return cosmiconfig('foo', explorerOptions)
      .search(startDir)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig('foo', explorerOptions).searchSync(startDir);
    checkResult(result);
  });
});

describe('without ignoring empty files, returns an empty config result for an empty .config.js file', () => {
  beforeEach(() => {
    temp.createFile('a/b/foo.config.js', '');
  });

  const startDir = temp.absolutePath('a/b');
  const explorerOptions = {
    stopDir: temp.absolutePath('a'),
    ignoreEmptySearchPlaces: false,
  };

  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: temp.absolutePath('a/b/foo.config.js'),
      isEmpty: true,
    });
  };

  test('async', () => {
    return cosmiconfig('foo', explorerOptions)
      .search(startDir)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig('foo', explorerOptions).searchSync(startDir);
    checkResult(result);
  });
});

describe('without ignoring empty files, returns an empty config result for an empty .json rc file', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.json', '');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('a'),
    ignoreEmptySearchPlaces: false,
  };

  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.json'),
      isEmpty: true,
    });
  };

  test('async', () => {
    return cosmiconfig('foo', explorerOptions)
      .search(startDir)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig('foo', explorerOptions).searchSync(startDir);
    checkResult(result);
  });
});

describe('returns an empty config result for an empty .yaml rc file', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.yaml', '');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('a'),
    ignoreEmptySearchPlaces: false,
  };

  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.yaml'),
      isEmpty: true,
    });
  };

  test('async', () => {
    return cosmiconfig('foo', explorerOptions)
      .search(startDir)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig('foo', explorerOptions).searchSync(startDir);
    checkResult(result);
  });
});

describe('without ignoring empty configs and searching for rc files with specified extensions, returns an empty config result for an empty .js rc file', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.js', '');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('a'),
    ignoreEmptySearchPlaces: false,
    searchPlaces: [
      'package.json',
      '.foorc',
      '.foorc.json',
      '.foorc.yaml',
      '.foorc.yml',
      '.foorc.js',
      'foo.config.js',
    ],
  };

  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.js'),
      isEmpty: true,
    });
  };

  test('async', () => {
    return cosmiconfig('foo', explorerOptions)
      .search(startDir)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig('foo', explorerOptions).searchSync(startDir);
    checkResult(result);
  });
});

describe('without ignoring empty configs and searching for rc files with specified extensions, returns an empty config result for an empty .js rc file with whitespace', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.js', ' \t\r\v\n\f');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('a'),
    ignoreEmptySearchPlaces: false,
    searchPlaces: [
      'package.json',
      '.foorc',
      '.foorc.json',
      '.foorc.yaml',
      '.foorc.yml',
      '.foorc.js',
      'foo.config.js',
    ],
  };

  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.js'),
      isEmpty: true,
    });
  };

  test('async', () => {
    return cosmiconfig('foo', explorerOptions)
      .search(startDir)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig('foo', explorerOptions).searchSync(startDir);
    checkResult(result);
  });
});

describe('throws error if a file in searchPlaces does not have a corresponding loader', () => {
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: [
      'package.json',
      '.foorc',
      '.foorc.things',
      '.foorc.js',
      'foo.config.js',
    ],
  };

  const checkError = error => {
    expect(error.message).toMatch(
      /No loader specified for extension "\.things"/
    );
  };

  test('on instantiation', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('foo', explorerOptions);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error if an extensionless file in searchPlaces does not have a corresponding loader', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc', '{ "foo": "bar" }');
  });

  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: ['package.json', '.foorc'],
    loaders: {
      noExt: undefined,
    },
  };

  const checkError = error => {
    expect(error.message).toMatch(
      /No loader specified for files without extensions/
    );
  };

  test('on instantiation', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('foo', explorerOptions);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('does not swallow errors from custom loaders', () => {
  const loadJs = () => {
    throw new Error('Failed to load JS');
  };

  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.js', 'module.exports = {};');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: ['package.json', '.foorc', '.foorc.js'],
    loaders: {
      '.js': loadJs,
    },
  };

  const checkError = error => {
    expect(error.message).toBe('Failed to load JS');
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('foo', explorerOptions)
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('foo', explorerOptions).searchSync(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('errors not swallowed when async custom loader throws them', () => {
  const startDir = temp.absolutePath('a/b/c/d/e/f');

  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/.foorc.things',
      'one\ntwo\nthree\t\t\n  four\n'
    );
  });

  const expectedError = new Error();
  const loadThingsAsync = () => {
    throw expectedError;
  };

  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: ['.foorc.things'],
    loaders: {
      '.things': { async: loadThingsAsync },
    },
  };

  const checkError = error => {
    expect(error).toBe(expectedError);
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('foo', explorerOptions)
      .search(startDir)
      .catch(checkError);
  });
});

describe('errors not swallowed when async custom loader rejects', () => {
  const startDir = temp.absolutePath('a/b/c/d/e/f');

  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/.foorc.things',
      'one\ntwo\nthree\t\t\n  four\n'
    );
  });

  const expectedError = new Error();
  const loadThingsAsync = () => {
    return Promise.reject(expectedError);
  };

  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: ['.foorc.things'],
    loaders: {
      '.things': { async: loadThingsAsync },
    },
  };

  const checkError = error => {
    expect(error).toBe(expectedError);
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('foo', explorerOptions)
      .search(startDir)
      .catch(checkError);
  });
});

describe('errors if only async loader is set but you call sync search', () => {
  const startDir = temp.absolutePath('a/b/c/d/e/f');

  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/.foorc.things',
      'one\ntwo\nthree\t\t\n  four\n'
    );
  });

  const loadThings = () => {
    return Promise.resolve({ things: true });
  };

  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: ['.foorc.things'],
    loaders: {
      '.things': { async: loadThings },
    },
  };

  const checkError = error => {
    expect(error.message).toMatch(
      /No sync loader specified for extension "\.things"/
    );
  };

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('foo', explorerOptions).searchSync(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('errors if it cannot figure out an async loader', () => {
  const startDir = temp.absolutePath('a/b/c/d/e/f');

  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/.foorc.things',
      'one\ntwo\nthree\t\t\n  four\n'
    );
  });

  const loadThings = () => {
    return Promise.resolve({ things: true });
  };

  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: ['.foorc.things'],
    loaders: {
      '.things': { wawa: loadThings },
    },
  };

  const checkError = error => {
    expect(error.message).toMatch(
      /No async loader specified for extension "\.things"/
    );
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('foo', explorerOptions)
      .search(startDir)
      .catch(checkError);
  });
});
