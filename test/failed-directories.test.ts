import fs from 'fs';
import { TempDir } from './util';
import {
  cosmiconfig,
  cosmiconfigSync,
  defaultLoaders,
  OptionsSync,
} from '../src';

const temp = new TempDir();

beforeEach(() => {
  temp.clean();
  temp.createDir('a/b/c/d/e/f/');
});

afterAll(() => {
  // Remove temp.dir created for tests
  temp.deleteTempDir();
});

describe('gives up if it cannot find the file', () => {
  const startDir = temp.absolutePath('a/b');
  const explorerOptions = { stopDir: temp.absolutePath('.') };

  const checkResult = (statSpy: any, readFileSpy: any, result: any) => {
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
      'a/b/.foorc.cjs',
      'a/b/.config/foorc',
      'a/b/.config/foorc.json',
      'a/b/.config/foorc.yaml',
      'a/b/.config/foorc.yml',
      'a/b/.config/foorc.js',
      'a/b/.config/foorc.cjs',
      'a/b/foo.config.js',
      'a/b/foo.config.cjs',
      'a/package.json',
      'a/.foorc',
      'a/.foorc.json',
      'a/.foorc.yaml',
      'a/.foorc.yml',
      'a/.foorc.js',
      'a/.foorc.cjs',
      'a/.config/foorc',
      'a/.config/foorc.json',
      'a/.config/foorc.yaml',
      'a/.config/foorc.yml',
      'a/.config/foorc.js',
      'a/.config/foorc.cjs',
      'a/foo.config.js',
      'a/foo.config.cjs',
      'package.json',
      '.foorc',
      '.foorc.json',
      '.foorc.yaml',
      '.foorc.yml',
      '.foorc.js',
      '.foorc.cjs',
      '.config/foorc',
      '.config/foorc.json',
      '.config/foorc.yaml',
      '.config/foorc.yml',
      '.config/foorc.js',
      '.config/foorc.cjs',
      'foo.config.js',
      'foo.config.cjs',
    ]);

    expect(result).toBe(null);
  };

  test('async', async () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const statSpy = jest.spyOn(fs, 'stat');

    const result = await cosmiconfig('foo', explorerOptions).search(startDir);
    checkResult(statSpy, readFileSpy, result);
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const statSpy = jest.spyOn(fs, 'statSync');

    const result = cosmiconfigSync('foo', explorerOptions).search(startDir);
    checkResult(statSpy, readFileSpy, result);
  });
});

describe('stops at stopDir and gives up', () => {
  const startDir = temp.absolutePath('a/b');
  const explorerOptions = { stopDir: temp.absolutePath('a') };

  const checkResult = (readFileSpy: any, result: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
      'a/b/package.json',
      'a/b/.foorc',
      'a/b/.foorc.json',
      'a/b/.foorc.yaml',
      'a/b/.foorc.yml',
      'a/b/.foorc.js',
      'a/b/.foorc.cjs',
      'a/b/.config/foorc',
      'a/b/.config/foorc.json',
      'a/b/.config/foorc.yaml',
      'a/b/.config/foorc.yml',
      'a/b/.config/foorc.js',
      'a/b/.config/foorc.cjs',
      'a/b/foo.config.js',
      'a/b/foo.config.cjs',
      'a/package.json',
      'a/.foorc',
      'a/.foorc.json',
      'a/.foorc.yaml',
      'a/.foorc.yml',
      'a/.foorc.js',
      'a/.foorc.cjs',
      'a/.config/foorc',
      'a/.config/foorc.json',
      'a/.config/foorc.yaml',
      'a/.config/foorc.yml',
      'a/.config/foorc.js',
      'a/.config/foorc.cjs',
      'a/foo.config.js',
      'a/foo.config.cjs',
    ]);

    expect(result).toBe(null);
  };

  test('async', async () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');

    const result = await cosmiconfig('foo', explorerOptions).search(startDir);
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');

    const result = cosmiconfigSync('foo', explorerOptions).search(startDir);
    checkResult(readFileSpy, result);
  });
});

describe('throws error for invalid YAML in rc file', () => {
  beforeEach(() => {
    temp.createFile('a/b/.foorc', 'found: true: broken');
  });

  const startDir = temp.absolutePath('a/b');
  const explorerOptions = { stopDir: temp.absolutePath('a') };

  const expectedError = `YAML Error in ${temp.absolutePath(
    'a/b/.foorc',
  )}:\nNested mappings are not allowed in compact mappings at line 1, column 8:`;

  test('async', async () => {
    await expect(
      cosmiconfig('foo', explorerOptions).search(startDir),
    ).rejects.toThrow(expectedError);
  });

  test('sync', () => {
    expect(() =>
      cosmiconfigSync('foo', explorerOptions).search(startDir),
    ).toThrow(expectedError);
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
      noExt: defaultLoaders['.json'],
    },
  };

  const expectedError = 'JSON Error in';

  test('async', async () => {
    await expect(
      cosmiconfig('foo', explorerOptions).search(startDir),
    ).rejects.toThrow(expectedError);
  });

  test('sync', () => {
    expect(() =>
      cosmiconfigSync('foo', explorerOptions).search(startDir),
    ).toThrow(expectedError);
  });
});

describe('throws error for invalid package.json', () => {
  beforeEach(() => {
    temp.createFile('a/b/package.json', '{ "foo": "bar", }');
  });

  const startDir = temp.absolutePath('a/b');
  const explorerOptions = { stopDir: temp.absolutePath('a') };

  const expectedError = 'JSON Error in';

  test('async', async () => {
    await expect(
      cosmiconfig('foo', explorerOptions).search(startDir),
    ).rejects.toThrow(expectedError);
  });

  test('sync', () => {
    expect(() =>
      cosmiconfigSync('foo', explorerOptions).search(startDir),
    ).toThrow(expectedError);
  });
});

describe('throws error for invalid JS in .config.js file', () => {
  beforeEach(() => {
    temp.createFile(
      'a/b/foo.config.js',
      'module.exports = { found: true: false,',
    );
  });

  const startDir = temp.absolutePath('a/b');
  const explorerOptions = { stopDir: temp.absolutePath('a') };

  test('async', async () => {
    await expect(
      cosmiconfig('foo', explorerOptions).search(startDir),
    ).rejects.toThrow();
  });

  test('sync', () => {
    expect(() =>
      cosmiconfigSync('foo', explorerOptions).search(startDir),
    ).toThrow();
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

  const expectedError = 'JSON Error in';

  test('async', async () => {
    await expect(
      cosmiconfig('foo', explorerOptions).search(startDir),
    ).rejects.toThrow(expectedError);
  });

  test('sync', () => {
    expect(() =>
      cosmiconfigSync('foo', explorerOptions).search(startDir),
    ).toThrow(expectedError);
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

  const expectedError = `YAML Error in ${temp.absolutePath(
    'a/b/c/d/e/f/.foorc.yml',
  )}:\nNested mappings are not allowed in compact mappings at line 1, column 8:`;

  test('async', async () => {
    await expect(
      cosmiconfig('foo', explorerOptions).search(startDir),
    ).rejects.toThrow(expectedError);
  });

  test('sync', () => {
    expect(() =>
      cosmiconfigSync('foo', explorerOptions).search(startDir),
    ).toThrow(expectedError);
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

  test('async', async () => {
    await expect(
      cosmiconfig('foo', explorerOptions).search(startDir),
    ).rejects.toThrow();
  });

  test('sync', () => {
    expect(() =>
      cosmiconfigSync('foo', explorerOptions).search(startDir),
    ).toThrow();
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

  const checkResult = (result: any) => {
    expect(result).toEqual({
      config: undefined,
      filepath: temp.absolutePath('a/b/.foorc'),
      isEmpty: true,
    });
  };

  test('async', async () => {
    const result = await cosmiconfig('foo', explorerOptions).search(startDir);
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigSync('foo', explorerOptions).search(startDir);
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

  const checkResult = (result: any) => {
    expect(result).toEqual({
      config: undefined,
      filepath: temp.absolutePath('a/b/foo.config.js'),
      isEmpty: true,
    });
  };

  test('async', async () => {
    const result = await cosmiconfig('foo', explorerOptions).search(startDir);
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigSync('foo', explorerOptions).search(startDir);
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

  const checkResult = (result: any) => {
    expect(result).toEqual({
      config: undefined,
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.json'),
      isEmpty: true,
    });
  };

  test('async', async () => {
    const result = await cosmiconfig('foo', explorerOptions).search(startDir);
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigSync('foo', explorerOptions).search(startDir);
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

  const checkResult = (result: any) => {
    expect(result).toEqual({
      config: undefined,
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.yaml'),
      isEmpty: true,
    });
  };

  test('async', async () => {
    const result = await cosmiconfig('foo', explorerOptions).search(startDir);
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigSync('foo', explorerOptions).search(startDir);
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

  const checkResult = (result: any) => {
    expect(result).toEqual({
      config: undefined,
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.js'),
      isEmpty: true,
    });
  };

  test('async', async () => {
    const result = await cosmiconfig('foo', explorerOptions).search(startDir);
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigSync('foo', explorerOptions).search(startDir);
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

  const checkResult = (result: any) => {
    expect(result).toEqual({
      config: undefined,
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.js'),
      isEmpty: true,
    });
  };

  test('async', async () => {
    const result = await cosmiconfig('foo', explorerOptions).search(startDir);
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigSync('foo', explorerOptions).search(startDir);
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

  test('on instantiation', () => {
    expect(() => cosmiconfigSync('foo', explorerOptions)).toThrow(
      'No loader specified for extension ".things"',
    );
  });
});

describe('throws error if an extensionless file in searchPlaces does not have a corresponding loader', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc', '{ "foo": "bar" }');
  });

  const explorerOptions: OptionsSync = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: ['package.json', '.foorc'],
    loaders: {
      // @ts-ignore
      noExt: undefined,
    },
  };

  test('on instantiation', () => {
    expect(() => cosmiconfigSync('foo', explorerOptions)).toThrow(
      'No loader specified for files without extensions',
    );
  });
});

describe('does not swallow errors from custom loaders', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.js', 'module.exports = {};');
  });

  const expectedError = new Error('Failed to load JS');
  const loadJs = () => {
    throw expectedError;
  };

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: ['package.json', '.foorc', '.foorc.js'],
    loaders: {
      '.js': loadJs,
    },
  };

  test('async', async () => {
    await expect(
      cosmiconfig('foo', explorerOptions).search(startDir),
    ).rejects.toThrow(expectedError);
  });

  test('sync', () => {
    expect(() =>
      cosmiconfigSync('foo', explorerOptions).search(startDir),
    ).toThrow(expectedError);
  });
});

describe('errors not swallowed when async custom loader throws them', () => {
  const startDir = temp.absolutePath('a/b/c/d/e/f');

  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/.foorc.things',
      'one\ntwo\nthree\t\t\n  four\n',
    );
  });

  const expectedError = new Error('loadThingsAsync error');
  const loadThingsAsync = () => {
    throw expectedError;
  };

  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: ['.foorc.things'],
    loaders: {
      '.things': loadThingsAsync,
    },
  };

  test('async', async () => {
    await expect(
      cosmiconfig('foo', explorerOptions).search(startDir),
    ).rejects.toThrow(expectedError);
  });
});

describe('errors not swallowed when async custom loader rejects', () => {
  const startDir = temp.absolutePath('a/b/c/d/e/f');

  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/.foorc.things',
      'one\ntwo\nthree\t\t\n  four\n',
    );
  });

  const expectedError = new Error('loadThingsAsync error');
  const loadThingsAsync = async () => {
    throw expectedError;
  };

  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: ['.foorc.things'],
    loaders: {
      '.things': loadThingsAsync,
    },
  };

  test('async', async () => {
    await expect(
      cosmiconfig('foo', explorerOptions).search(startDir),
    ).rejects.toThrow(expectedError);
  });
});
