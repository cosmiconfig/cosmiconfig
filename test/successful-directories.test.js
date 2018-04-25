'use strict';

const fs = require('fs');
const util = require('./util');
const cosmiconfig = require('../src');

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

describe('finds rc file in third searched dir, with a package.json lacking prop', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/package.json', '{ "false": "hope" }');
    temp.createFile('a/b/c/d/.foorc', '{ "found": true }');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = { stopDir: temp.absolutePath('.') };

  const checkResult = (readFileSpy, result) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
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
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
    });
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

describe('finds package.json prop in second searched dir', () => {
  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/package.json',
      '{ "author": "Todd", "foo": { "found": true } }'
    );
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = { stopDir: temp.absolutePath('.') };

  const checkResult = (readFileSpy, result) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/foo.config.js',
      'a/b/c/d/e/package.json',
    ]);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/package.json'),
    });
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

describe('finds JS file in first searched dir', () => {
  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/foo.config.js',
      'module.exports = { found: true };'
    );
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = { stopDir: temp.absolutePath('.') };

  const checkResult = (readFileSpy, result) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);

    expect(filesChecked).toEqual([
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/foo.config.js',
    ]);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/foo.config.js'),
    });
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

describe('finds package.json in second dir searched, with alternate names', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/package.json', '{ "heeha": { "found": true } }');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchSchema: [
      { filename: 'package.json', property: 'heeha' },
      '.wowza',
      'wowzaConfig.js'
    ]
  };

  const checkResult = (readFileSpy, result) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.wowza',
      'a/b/c/d/e/f/wowzaConfig.js',
      'a/b/c/d/e/package.json',
    ]);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/package.json'),
    });
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

describe('finds rc file in third searched dir, skipping packageProp, with JSON-only rc', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/.foorc', '{ "found": true }');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchSchema: [
      { filename: '.foorc', loader: cosmiconfig.loadJson },
      'foo.config.js'
    ]
  };

  const checkResult = (readFileSpy, result) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/foo.config.js',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/foo.config.js',
      'a/b/c/d/.foorc',
    ]);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
    });
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

describe('finds rc file in third searched dir, skipping JS and RC files, with JSON-only rc', () => {
  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/package.json',
      '{ "author": "Todd", "foo": { "found": true } }'
    );
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    searchSchema: [
      'package.json'
    ]
  };

  const checkResult = (readFileSpy, result) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/package.json',
    ]);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/package.json'),
    });
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

describe('looking for rc with extensions, finds .foorc.json in second searched dir', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/.foorc.json', '{ "found": true }');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchSchema: [
      'package.json',
      '.foorc',
      '.foorc.json',
      '.foorc.yaml',
      '.foorc.yml',
      '.foorc.js',
      'foo.config.js'
    ]
  };

  const checkResult = (readFileSpy, result) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
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
      filepath: temp.absolutePath('a/b/c/d/e/.foorc.json'),
    });
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

describe('looking for rc with extensions, finds .foorc.yaml in first searched dir', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.yaml', 'found: true');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchSchema: [
      'package.json',
      '.foorc',
      '.foorc.json',
      '.foorc.yaml',
      '.foorc.yml',
      '.foorc.js',
      'foo.config.js'
    ]
  };

  const checkResult = (readFileSpy, result) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/.foorc.json',
      'a/b/c/d/e/f/.foorc.yaml',
    ]);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.yaml'),
    });
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

describe('looking for rc with extensions, finds .foorc.yml in first searched dir', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.yml', 'found: true');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchSchema: [
      'package.json',
      '.foorc',
      '.foorc.json',
      '.foorc.yaml',
      '.foorc.yml',
      '.foorc.js',
      'foo.config.js'
    ]
  };

  const checkResult = (readFileSpy, result) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/.foorc.json',
      'a/b/c/d/e/f/.foorc.yaml',
      'a/b/c/d/e/f/.foorc.yml',
    ]);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.yml'),
    });
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

describe('looking for rc with extensions, finds .foorc.js in first searched dir', () => {
  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/.foorc.js',
      'module.exports = { found: true };'
    );
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchSchema: [
      'package.json',
      '.foorc',
      '.foorc.json',
      '.foorc.yaml',
      '.foorc.yml',
      '.foorc.js',
      'foo.config.js'
    ]
  };

  const checkResult = (readFileSpy, result) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/.foorc.json',
      'a/b/c/d/e/f/.foorc.yaml',
      'a/b/c/d/e/f/.foorc.yml',
      'a/b/c/d/e/f/.foorc.js',
    ]);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.js'),
    });
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

describe('finds JS file traversing from cwd', () => {
  const originalCwd = process.cwd();
  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/foo.config.js',
      'module.exports = { found: true };'
    );

    process.chdir(temp.absolutePath('a/b/c/d/e/f'));
  });

  afterEach(() => {
    process.chdir(originalCwd);
  });

  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
  };

  const checkResult = (readFileSpy, result) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/foo.config.js',
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/foo.config.js',
    ]);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/foo.config.js'),
    });
  };

  test('async', () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    return cosmiconfig('foo', explorerOptions)
      .search()
      .then(result => {
        checkResult(readFileSpy, result);
      });
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const result = cosmiconfig('foo', explorerOptions).searchSync();
    checkResult(readFileSpy, result);
  });
});
