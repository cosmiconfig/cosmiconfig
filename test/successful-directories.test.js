import fs from 'fs';
import { TempDir } from './util';
import { cosmiconfig } from '../src';

const temp = new TempDir();

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
      'a/b/c/d/e/f/.foorc.json',
      'a/b/c/d/e/f/.foorc.yaml',
      'a/b/c/d/e/f/.foorc.yml',
      'a/b/c/d/e/f/.foorc.js',
      'a/b/c/d/e/f/foo.config.js',
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/.foorc.json',
      'a/b/c/d/e/.foorc.yaml',
      'a/b/c/d/e/.foorc.yml',
      'a/b/c/d/e/.foorc.js',
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
      '{ "author": "Todd", "foo": { "found": true } }',
    );
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = { stopDir: temp.absolutePath('.') };

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

describe('finds package.json with nested packageProp in second searched dir', () => {
  beforeEach(() => {
    // First package.json exists but does not include the nested packageProp.
    temp.createFile(
      'a/b/c/d/e/f/package.json',
      '{ "author": "Todd", "configs": { "notYourPkg": { "yes": "ofcourse" } } }',
    );
    temp.createFile(
      'a/b/c/d/e/package.json',
      '{ "author": "Todd", "configs": { "pkg": { "please": "no" } } }',
    );
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    packageProp: 'configs.pkg',
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
    ]);

    expect(result).toEqual({
      config: { please: 'no' },
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
      'module.exports = { found: true };',
    );
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = { stopDir: temp.absolutePath('.') };

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

describe('finds .foorc.js file in first searched dir', () => {
  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/.foorc.js',
      'module.exports = { found: true };',
    );
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = { stopDir: temp.absolutePath('.') };

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

describe('skips over empty file to find JS file in first searched dir', () => {
  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/foo.config.js',
      'module.exports = { found: true };',
    );
    temp.createFile('a/b/c/d/e/f/.foorc', '');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = { stopDir: temp.absolutePath('.') };

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
    packageProp: 'heeha',
    searchPlaces: ['package.json', '.wowza', 'wowzaConfig.js'],
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

describe('finds rc file in third searched dir, skipping packageProp, parsing extensionless files as JSON', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/.foorc', '{ "found": true }');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    loaders: {
      noExt: cosmiconfig.loadJson,
    },
    searchPlaces: ['.foorc', 'foo.config.js'],
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

describe('finds package.json file in second searched dir, skipping JS and RC files', () => {
  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/package.json',
      '{ "author": "Todd", "foo": { "found": true } }',
    );
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    searchPlaces: ['package.json'],
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

describe('finds .foorc.json in second searched dir', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/.foorc.json', '{ "found": true }');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
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

describe('finds .foorc.yaml in first searched dir', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.yaml', 'found: true');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
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

describe('finds .foorc.yml in first searched dir', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.yml', 'found: true');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
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

describe('adding myfooconfig.js to searchPlaces, finds it in first searched dir', () => {
  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/myfooconfig.js',
      'module.exports = { found: true };',
    );
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
      'myfooconfig.js',
    ],
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
      'a/b/c/d/e/f/myfooconfig.js',
    ]);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/myfooconfig.js'),
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
      'module.exports = { found: true };',
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
      'a/b/c/d/e/f/.foorc.json',
      'a/b/c/d/e/f/.foorc.yaml',
      'a/b/c/d/e/f/.foorc.yml',
      'a/b/c/d/e/f/.foorc.js',
      'a/b/c/d/e/f/foo.config.js',
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/.foorc.json',
      'a/b/c/d/e/.foorc.yaml',
      'a/b/c/d/e/.foorc.yml',
      'a/b/c/d/e/.foorc.js',
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

describe('searchPlaces can include subdirectories', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/.config/.foorc.json', '{ "found": true }');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: [
      '.foorc.json',
      'package.json',
      '.config/.foorc.json',
      '.config/foo/config.json',
    ],
  };

  const checkResult = (readFileSpy, result) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
      'a/b/c/d/e/f/.foorc.json',
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.config/.foorc.json',
      'a/b/c/d/e/f/.config/foo/config.json',
      'a/b/c/d/e/.foorc.json',
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.config/.foorc.json',
    ]);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/.config/.foorc.json'),
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

describe('custom loaders allow non-default file types', () => {
  const loadThings = (filepath, content) => {
    return {
      things: content
        .split('\n')
        .map(x => x.trim())
        .filter(x => !!x),
    };
  };

  const loadGrumbly = () => ({ grumbly: true });

  beforeEach(() => {
    temp.createFile('a/b/c/d/e/.foorc.things', 'one\ntwo\nthree\t\t\n  four\n');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: [
      'package.json',
      '.foorc.json',
      '.foorc.yml',
      '.foorc.things',
      '.foorc.grumbly',
    ],
    loaders: {
      '.things': loadThings,
      '.grumbly': loadGrumbly,
    },
  };

  const checkResult = (readFileSpy, result) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc.json',
      'a/b/c/d/e/f/.foorc.yml',
      'a/b/c/d/e/f/.foorc.things',
      'a/b/c/d/e/f/.foorc.grumbly',
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc.json',
      'a/b/c/d/e/.foorc.yml',
      'a/b/c/d/e/.foorc.things',
    ]);

    expect(result).toEqual({
      config: { things: ['one', 'two', 'three', 'four'] },
      filepath: temp.absolutePath('a/b/c/d/e/.foorc.things'),
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

describe('adding custom loaders allows for default and non-default file types', () => {
  const loadThings = (filepath, content) => {
    return {
      things: content
        .split('\n')
        .map(x => x.trim())
        .filter(x => !!x),
    };
  };

  const loadGrumbly = () => ({ grumbly: true });

  beforeEach(() => {
    temp.createFile('a/b/c/d/e/.foorc.things', 'one\ntwo\nthree\t\t\n  four\n');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: [
      'package.json',
      '.foorc.json',
      '.foorc.yml',
      '.foorc.things',
      '.foorc.grumbly',
    ],
    loaders: {
      '.things': loadThings,
      '.grumbly': loadGrumbly,
    },
  };

  const checkResult = (readFileSpy, result) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc.json',
      'a/b/c/d/e/f/.foorc.yml',
      'a/b/c/d/e/f/.foorc.things',
      'a/b/c/d/e/f/.foorc.grumbly',
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc.json',
      'a/b/c/d/e/.foorc.yml',
      'a/b/c/d/e/.foorc.things',
    ]);

    expect(result).toEqual({
      config: { things: ['one', 'two', 'three', 'four'] },
      filepath: temp.absolutePath('a/b/c/d/e/.foorc.things'),
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

describe('defaults loaders can be overridden', () => {
  const loadGrumbly = () => ({ grumbly: true });

  beforeEach(() => {
    temp.createFile('a/b/c/d/e/foo.config.js', 'foo');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: [
      'package.json',
      '.foorc.json',
      'foo.config.js',
      '.foorc.yml',
    ],
    loaders: {
      '.js': loadGrumbly,
    },
  };

  const checkResult = (readFileSpy, result) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc.json',
      'a/b/c/d/e/f/foo.config.js',
      'a/b/c/d/e/f/.foorc.yml',
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc.json',
      'a/b/c/d/e/foo.config.js',
    ]);

    expect(result).toEqual({
      config: { grumbly: true },
      filepath: temp.absolutePath('a/b/c/d/e/foo.config.js'),
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

describe('custom loaders can be async', () => {
  const startDir = temp.absolutePath('a/b/c/d/e/f');

  let loadThingsSync;
  let loadThingsAsync;
  let explorerOptions;
  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/.foorc.things',
      'one\ntwo\nthree\t\t\n  four\n',
    );
    loadThingsSync = jest.fn(() => {
      return { things: true };
    });
    loadThingsAsync = jest.fn(() => {
      return Promise.resolve({ things: true });
    });
    explorerOptions = {
      stopDir: temp.absolutePath('.'),
      searchPlaces: ['.foorc.things'],
      loaders: {
        '.things': { sync: loadThingsSync, async: loadThingsAsync },
      },
    };
  });

  const checkResult = (readFileSpy, result) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(['a/b/c/d/e/f/.foorc.things']);

    expect(result).toEqual({
      config: { things: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.things'),
    });
  };

  test('async', () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    return cosmiconfig('foo', explorerOptions)
      .search(startDir)
      .then(result => {
        expect(loadThingsSync).not.toHaveBeenCalled();
        expect(loadThingsAsync).toHaveBeenCalled();
        checkResult(readFileSpy, result);
      });
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const result = cosmiconfig('foo', explorerOptions).searchSync(startDir);
    expect(loadThingsSync).toHaveBeenCalled();
    expect(loadThingsAsync).not.toHaveBeenCalled();
    checkResult(readFileSpy, result);
  });
});

describe('a custom loader entry can include just an async loader', () => {
  const startDir = temp.absolutePath('a/b/c/d/e/f');

  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/.foorc.things',
      'one\ntwo\nthree\t\t\n  four\n',
    );
  });

  const loadThingsAsync = () => {
    return Promise.resolve({ things: true });
  };

  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: ['.foorc.things'],
    loaders: {
      '.things': { async: loadThingsAsync },
    },
  };

  const checkResult = (readFileSpy, result) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(['a/b/c/d/e/f/.foorc.things']);

    expect(result).toEqual({
      config: { things: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.things'),
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
});

describe('a custom loader entry can include only a sync loader and work for both sync and async functions', () => {
  const startDir = temp.absolutePath('a/b/c/d/e/f');

  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/.foorc.things',
      'one\ntwo\nthree\t\t\n  four\n',
    );
  });

  const loadThingsSync = () => {
    return { things: true };
  };

  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: ['.foorc.things'],
    loaders: {
      '.things': { sync: loadThingsSync },
    },
  };

  const checkResult = (readFileSpy, result) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(['a/b/c/d/e/f/.foorc.things']);

    expect(result).toEqual({
      config: { things: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.things'),
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

describe('works fine if sync loader returns a Promise from a JS file', () => {
  const startDir = temp.absolutePath('a/b/c/d/e/f');
  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/bar.config.js',
      'module.exports = Promise.resolve({ a: 1 });',
    );
  });

  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: ['bar.config.js'],
  };

  test('sync', () => {
    const result = cosmiconfig('bar', explorerOptions).searchSync(startDir);
    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/e/f/bar.config.js'),
      config: expect.any(Promise),
    });
    return result.config.then(resolved => {
      expect(resolved).toEqual({ a: 1 });
    });
  });
});
