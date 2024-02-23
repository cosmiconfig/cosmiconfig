import envPaths from 'env-paths';
import path from 'path';
import { beforeEach, afterAll, describe, expect, test, vi } from 'vitest';
import fs from 'fs';
import fsPromises from 'fs/promises';
import {
  cosmiconfigBasic,
  cosmiconfigBasicSync,
  defaultLoaders,
} from '../src/basic';
import { TempDir } from './util';
import { OptionsSync } from '@cosmiconfig/types';

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
    'a/b/.config/foorc',
    'a/b/.config/foorc.json',
    'a/package.json',
    'a/.foorc',
    'a/.foorc.json',
    'a/.config/foorc',
    'a/.config/foorc.json',
    'package.json',
    '.foorc',
    '.foorc.json',
    '.config/foorc',
    '.config/foorc.json',
    ...['config', 'config.json'].map((place) =>
      path.join(relativeGlobalConfigPath, place),
    ),
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
    const explorer = cosmiconfigBasic('foo', explorerOptions);

    const readFileSpy = vi.spyOn(fsPromises, 'readFile');
    const statSpy = vi.spyOn(fsPromises, 'stat');

    const result = await explorer.search(startDir);
    checkResult(statSpy, readFileSpy, result, expectedFilesChecked);
  });

  test('sync', () => {
    const explorer = cosmiconfigBasicSync('foo', explorerOptions);

    const readFileSpy = vi.spyOn(fs, 'readFileSync');
    const statSpy = vi.spyOn(fs, 'statSync');

    const result = explorer.search(startDir);
    checkResult(statSpy, readFileSpy, result, expectedFilesChecked);
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
    'a/b/.config/foorc',
    'a/b/.config/foorc.json',
    'a/package.json',
    'a/.foorc',
    'a/.foorc.json',
    'a/.config/foorc',
    'a/.config/foorc.json',
    ...['config', 'config.json'].map((place) =>
      path.join(relativeGlobalConfigPath, place),
    ),
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toBeNull();
  };

  test('async', async () => {
    const explorer = cosmiconfigBasic('foo', explorerOptions);

    const readFileSpy = vi.spyOn(fsPromises, 'readFile');
    const result = await explorer.search(startDir);
    checkResult(readFileSpy, result, expectedFilesChecked);
  });

  test('sync', () => {
    const explorer = cosmiconfigBasicSync('foo', explorerOptions);

    const readFileSpy = vi.spyOn(fs, 'readFileSync');
    const result = explorer.search(startDir);
    checkResult(readFileSpy, result, expectedFilesChecked);
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
      cosmiconfigBasic('foo', explorerOptions).search(startDir),
    ).rejects.toThrow(expectedError);
  });

  test('sync', () => {
    expect(() =>
      cosmiconfigBasicSync('foo', explorerOptions).search(startDir),
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
      cosmiconfigBasic('foo', explorerOptions).search(startDir),
    ).rejects.toThrow(expectedError);
  });

  test('sync', () => {
    expect(() =>
      cosmiconfigBasicSync('foo', explorerOptions).search(startDir),
    ).toThrow(expectedError);
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
      cosmiconfigBasic('foo', explorerOptions).search(startDir),
    ).rejects.toThrow(expectedError);
  });

  test('sync', () => {
    expect(() =>
      cosmiconfigBasicSync('foo', explorerOptions).search(startDir),
    ).toThrow(expectedError);
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
    const result = await cosmiconfigBasic('foo', explorerOptions).search(
      startDir,
    );
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigBasicSync('foo', explorerOptions).search(
      startDir,
    );
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
    const result = await cosmiconfigBasic('foo', explorerOptions).search(
      startDir,
    );
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigBasicSync('foo', explorerOptions).search(
      startDir,
    );
    checkResult(result);
  });
});

describe('returns an empty config result for an empty .json rc file', () => {
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
    const result = await cosmiconfigBasic('foo', explorerOptions).search(
      startDir,
    );
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigBasicSync('foo', explorerOptions).search(
      startDir,
    );
    checkResult(result);
  });
});

describe('without ignoring empty configs and searching for rc files with specified extensions, returns an empty config result for an empty .json rc file', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.json', '');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('a'),
    ignoreEmptySearchPlaces: false,
    searchPlaces: ['package.json', '.foorc', '.foorc.json'],
  };

  const checkResult = (result: any) => {
    expect(result).toEqual({
      config: undefined,
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.json'),
      isEmpty: true,
    });
  };

  test('async', async () => {
    const result = await cosmiconfigBasic('foo', explorerOptions).search(
      startDir,
    );
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigBasicSync('foo', explorerOptions).search(
      startDir,
    );
    checkResult(result);
  });
});

describe('without ignoring empty configs and searching for rc files with specified extensions, returns an empty config result for an empty .json rc file with whitespace', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.json', ' \t\r\v\n\f');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('a'),
    ignoreEmptySearchPlaces: false,
    searchPlaces: ['package.json', '.foorc', '.foorc.json'],
  };

  const checkResult = (result: any) => {
    expect(result).toEqual({
      config: undefined,
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.json'),
      isEmpty: true,
    });
  };

  test('async', async () => {
    const result = await cosmiconfigBasic('foo', explorerOptions).search(
      startDir,
    );
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigBasicSync('foo', explorerOptions).search(
      startDir,
    );
    checkResult(result);
  });
});

describe('throws error if a file in searchPlaces does not have a corresponding loader', () => {
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: ['package.json', '.foorc', '.foorc.things', '.foorc.json'],
  };

  test('on instantiation', () => {
    expect(() => cosmiconfigBasicSync('foo', explorerOptions)).toThrow(
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
    expect(() => cosmiconfigBasicSync('foo', explorerOptions)).toThrow(
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
    const result = await cosmiconfigBasic('foo', explorerOptions).search(
      tempDir,
    );

    expect(result).toBeNull();
  });

  test('sync', () => {
    const result = cosmiconfigBasicSync('foo', explorerOptions).search(tempDir);

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
      cosmiconfigBasic('foo', explorerOptions).search(startDir),
    ).rejects.toThrow(expectedError);
  });

  test('sync', () => {
    expect(() =>
      cosmiconfigBasicSync('foo', explorerOptions).search(startDir),
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
      cosmiconfigBasic('foo', explorerOptions).search(startDir),
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
      cosmiconfigBasic('foo', explorerOptions).search(startDir),
    ).rejects.toThrow(expectedError);
  });
});
