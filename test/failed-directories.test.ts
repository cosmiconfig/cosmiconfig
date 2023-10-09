import envPaths from 'env-paths';
import path from 'path';
import { beforeEach, afterAll, describe, expect, test, vi } from 'vitest';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { cosmiconfig, cosmiconfigSync, OptionsSync } from '../src';
import { defaultLoaders } from '../src/defaults';
import { isNotMjs, TempDir } from './util';

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

  const globalConfigPath = envPaths('foo', { suffix: '' }).config;
  // sorry, we have to create this folder even on a testing system, so we can spy on the reads properly
  fs.mkdirSync(globalConfigPath, { recursive: true });
  const relativeGlobalConfigPath = path.relative(temp.dir, globalConfigPath);

  const expectedFilesChecked = [
    'a/b/package.json',
    'a/b/.foorc',
    'a/b/.foorc.json',
    'a/b/.foorc.yaml',
    'a/b/.foorc.yml',
    'a/b/.foorc.js',
    'a/b/.foorc.ts',
    'a/b/.foorc.cjs',
    'a/b/.foorc.mjs',
    'a/b/.config/foorc',
    'a/b/.config/foorc.json',
    'a/b/.config/foorc.yaml',
    'a/b/.config/foorc.yml',
    'a/b/.config/foorc.js',
    'a/b/.config/foorc.ts',
    'a/b/.config/foorc.cjs',
    'a/b/.config/foorc.mjs',
    'a/b/foo.config.js',
    'a/b/foo.config.ts',
    'a/b/foo.config.cjs',
    'a/b/foo.config.mjs',
    'a/package.json',
    'a/.foorc',
    'a/.foorc.json',
    'a/.foorc.yaml',
    'a/.foorc.yml',
    'a/.foorc.js',
    'a/.foorc.ts',
    'a/.foorc.cjs',
    'a/.foorc.mjs',
    'a/.config/foorc',
    'a/.config/foorc.json',
    'a/.config/foorc.yaml',
    'a/.config/foorc.yml',
    'a/.config/foorc.js',
    'a/.config/foorc.ts',
    'a/.config/foorc.cjs',
    'a/.config/foorc.mjs',
    'a/foo.config.js',
    'a/foo.config.ts',
    'a/foo.config.cjs',
    'a/foo.config.mjs',
    'package.json',
    '.foorc',
    '.foorc.json',
    '.foorc.yaml',
    '.foorc.yml',
    '.foorc.js',
    '.foorc.ts',
    '.foorc.cjs',
    '.foorc.mjs',
    '.config/foorc',
    '.config/foorc.json',
    '.config/foorc.yaml',
    '.config/foorc.yml',
    '.config/foorc.js',
    '.config/foorc.ts',
    '.config/foorc.cjs',
    '.config/foorc.mjs',
    'foo.config.js',
    'foo.config.ts',
    'foo.config.cjs',
    'foo.config.mjs',
    ...[
      'config',
      'config.json',
      'config.yaml',
      'config.yml',
      'config.js',
      'config.ts',
      'config.cjs',
      'config.mjs',
    ].map((place) => path.join(relativeGlobalConfigPath, place)),
  ];

  const checkResult = (
    statSpy: any,
    readFileSpy: any,
    result: any,
    files: any,
  ) => {
    const statPath = temp.getSpyPathCalls(statSpy);
    expect(statPath).toEqual(['a/b', 'a', '', relativeGlobalConfigPath]);

    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toBeNull();
  };

  test('async', async () => {
    const explorer = cosmiconfig('foo', explorerOptions);

    const readFileSpy = vi.spyOn(fsPromises, 'readFile');
    const statSpy = vi.spyOn(fs, 'stat');

    const result = await explorer.search(startDir);
    checkResult(statSpy, readFileSpy, result, expectedFilesChecked);
  });

  test('sync', () => {
    const explorer = cosmiconfigSync('foo', explorerOptions);

    const readFileSpy = vi.spyOn(fs, 'readFileSync');
    const statSpy = vi.spyOn(fs, 'statSync');

    const result = explorer.search(startDir);
    checkResult(
      statSpy,
      readFileSpy,
      result,
      expectedFilesChecked.filter(isNotMjs),
    );
  });
});

describe('stops at stopDir and gives up', () => {
  const startDir = temp.absolutePath('a/b');
  const explorerOptions = { stopDir: temp.absolutePath('a') };

  const globalConfigPath = envPaths('foo', { suffix: '' }).config;
  // sorry, we have to create this folder even on a testing system, so we can spy on the reads properly
  fs.mkdirSync(globalConfigPath, { recursive: true });
  const relativeGlobalConfigPath = path.relative(temp.dir, globalConfigPath);

  const expectedFilesChecked = [
    'a/b/package.json',
    'a/b/.foorc',
    'a/b/.foorc.json',
    'a/b/.foorc.yaml',
    'a/b/.foorc.yml',
    'a/b/.foorc.js',
    'a/b/.foorc.ts',
    'a/b/.foorc.cjs',
    'a/b/.foorc.mjs',
    'a/b/.config/foorc',
    'a/b/.config/foorc.json',
    'a/b/.config/foorc.yaml',
    'a/b/.config/foorc.yml',
    'a/b/.config/foorc.js',
    'a/b/.config/foorc.ts',
    'a/b/.config/foorc.cjs',
    'a/b/.config/foorc.mjs',
    'a/b/foo.config.js',
    'a/b/foo.config.ts',
    'a/b/foo.config.cjs',
    'a/b/foo.config.mjs',
    'a/package.json',
    'a/.foorc',
    'a/.foorc.json',
    'a/.foorc.yaml',
    'a/.foorc.yml',
    'a/.foorc.js',
    'a/.foorc.ts',
    'a/.foorc.cjs',
    'a/.foorc.mjs',
    'a/.config/foorc',
    'a/.config/foorc.json',
    'a/.config/foorc.yaml',
    'a/.config/foorc.yml',
    'a/.config/foorc.js',
    'a/.config/foorc.ts',
    'a/.config/foorc.cjs',
    'a/.config/foorc.mjs',
    'a/foo.config.js',
    'a/foo.config.ts',
    'a/foo.config.cjs',
    'a/foo.config.mjs',
    ...[
      'config',
      'config.json',
      'config.yaml',
      'config.yml',
      'config.js',
      'config.ts',
      'config.cjs',
      'config.mjs',
    ].map((place) => path.join(relativeGlobalConfigPath, place)),
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toBeNull();
  };

  test('async', async () => {
    const explorer = cosmiconfig('foo', explorerOptions);

    const readFileSpy = vi.spyOn(fsPromises, 'readFile');
    const result = await explorer.search(startDir);
    checkResult(readFileSpy, result, expectedFilesChecked);
  });

  test('sync', () => {
    const explorer = cosmiconfigSync('foo', explorerOptions);

    const readFileSpy = vi.spyOn(fs, 'readFileSync');
    const result = explorer.search(startDir);
    checkResult(readFileSpy, result, expectedFilesChecked.filter(isNotMjs));
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
  )}:\nbad indentation of a mapping entry (1:12)`;

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
  )}:\nbad indentation of a mapping entry (1:13)`;

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
      'Missing loader for extension ".foorc.things"',
    );
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
  } as unknown as OptionsSync;

  test('on instantiation', () => {
    expect(() => cosmiconfigSync('foo', explorerOptions)).toThrow(
      'Missing loader for extension ".foorc".',
    );
  });
});

describe('does not throw error when trying to access a folder that is actually a file', () => {
  beforeEach(() => {
    temp.createFile('.config', '');
  });

  const tempDir = temp.absolutePath('.');
  const explorerOptions = {
    stopDir: tempDir,
  };

  test('async', async () => {
    const result = await cosmiconfig('foo', explorerOptions).search(tempDir);

    expect(result).toBeNull();
  });

  test('sync', () => {
    const result = cosmiconfigSync('foo', explorerOptions).search(tempDir);

    expect(result).toBeNull();
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
