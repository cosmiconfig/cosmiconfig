import {
  beforeEach,
  afterEach,
  afterAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { cosmiconfig, cosmiconfigSync } from '../src';
import { isNotMjs, TempDir } from './util.js';

const temp = new TempDir();

beforeEach(() => {
  temp.clean();
  temp.createDir('a/b/c/d/e/f/');
  temp.createJsonFile('a/b/c/d/package.json', { false: 'hope' });
  temp.createFile('a/b/c/d/.foorc', JSON.stringify({ foundInD: true }));
  temp.createJsonFile('a/b/package.json', { foo: { foundInB: true } });
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  // Remove temp.dir created for tests
  temp.deleteTempDir();
});

describe('cache is not used initially', () => {
  const searchPath = temp.absolutePath('a/b/c/d/e');

  const expectedFilesChecked = [
    'a/b/c/d/e/package.json',
    'a/b/c/d/e/.foorc',
    'a/b/c/d/e/.foorc.json',
    'a/b/c/d/e/.foorc.js',
    'a/b/c/d/e/.foorc.cjs',
    'a/b/c/d/e/.foorc.mjs',
    'a/b/c/d/e/.config/foorc',
    'a/b/c/d/e/.config/foorc.json',
    'a/b/c/d/e/.config/foorc.js',
    'a/b/c/d/e/.config/foorc.cjs',
    'a/b/c/d/e/.config/foorc.mjs',
    'a/b/c/d/e/foo.config.js',
    'a/b/c/d/e/foo.config.cjs',
    'a/b/c/d/e/foo.config.mjs',
    'a/b/c/d/package.json',
    'a/b/c/d/.foorc',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', async () => {
    const explorer = cosmiconfig('foo', { searchStrategy: 'global' });
    const readFileSpy = vi.spyOn(fsPromises, 'readFile');
    const cachedSearch = explorer.search;
    const result = await cachedSearch(searchPath);
    checkResult(readFileSpy, result, expectedFilesChecked);
  });

  test('sync', () => {
    const explorer = cosmiconfigSync('foo', { searchStrategy: 'global' });
    const readFileSpy = vi.spyOn(fs, 'readFileSync');
    const cachedSearchSync = explorer.search;
    const result = cachedSearchSync(searchPath);
    checkResult(readFileSpy, result, expectedFilesChecked.filter(isNotMjs));
  });
});

describe('cache is used for already-visited directories', () => {
  const searchPath = temp.absolutePath('a/b/c/d/e');

  const checkResult = (readFileSpy: any, result: any) => {
    expect(readFileSpy).toHaveBeenCalledTimes(0);

    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', async () => {
    const readFileSpy = vi.spyOn(fsPromises, 'readFile');
    const cachedSearch = cosmiconfig('foo', {
      searchStrategy: 'global',
    }).search;
    // First pass, prime the cache ...
    await cachedSearch(searchPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();

    const result = await cachedSearch(searchPath);
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const readFileSpy = vi.spyOn(fs, 'readFileSync');
    const cachedSearchSync = cosmiconfigSync('foo', {
      searchStrategy: 'global',
    }).search;
    // First pass, prime the cache ...
    cachedSearchSync(searchPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();

    const result = cachedSearchSync(searchPath);
    checkResult(readFileSpy, result);
  });
});

describe('cache is used for already-loaded file', () => {
  const loadPath = temp.absolutePath('a/b/c/d/.foorc');

  const checkResult = (readFileSpy: any, result: any) => {
    expect(readFileSpy).toHaveBeenCalledTimes(0);

    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', async () => {
    const cachedLoad = cosmiconfig('foo').load;
    // First pass, prime the cache ...
    await cachedLoad(loadPath);

    // Mock and search again.
    const readFileSpy = vi.spyOn(fsPromises, 'readFile');
    const result = await cachedLoad(loadPath);
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const cachedLoadSync = cosmiconfigSync('foo').load;
    // First pass, prime the cache ...
    cachedLoadSync(loadPath);

    // Mock and search again.
    const readFileSpy = vi.spyOn(fs, 'readFileSync');
    const result = cachedLoadSync(loadPath);
    checkResult(readFileSpy, result);
  });
});

describe('cache is used when some directories in search are already visted', () => {
  const firstSearchPath = temp.absolutePath('a/b/c/d/e');
  const secondSearchPath = temp.absolutePath('a/b/c/d/e/f');

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.js',
    'a/b/c/d/e/f/.foorc.cjs',
    'a/b/c/d/e/f/.foorc.mjs',
    'a/b/c/d/e/f/.config/foorc',
    'a/b/c/d/e/f/.config/foorc.json',
    'a/b/c/d/e/f/.config/foorc.js',
    'a/b/c/d/e/f/.config/foorc.cjs',
    'a/b/c/d/e/f/.config/foorc.mjs',
    'a/b/c/d/e/f/foo.config.js',
    'a/b/c/d/e/f/foo.config.cjs',
    'a/b/c/d/e/f/foo.config.mjs',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', async () => {
    const readFileSpy = vi.spyOn(fsPromises, 'readFile');
    const cachedSearch = cosmiconfig('foo', {
      searchStrategy: 'global',
    }).search;
    // First pass, prime the cache ...
    await cachedSearch(firstSearchPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();

    const result = await cachedSearch(secondSearchPath);
    checkResult(readFileSpy, result, expectedFilesChecked);
  });

  test('sync', () => {
    const readFileSpy = vi.spyOn(fs, 'readFileSync');
    const cachedSearchSync = cosmiconfigSync('foo', {
      searchStrategy: 'global',
    }).search;
    // First pass, prime the cache ...
    cachedSearchSync(firstSearchPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();

    const result = cachedSearchSync(secondSearchPath);
    checkResult(readFileSpy, result, expectedFilesChecked.filter(isNotMjs));
  });
});

describe('cache is not used when directly loading an unvisited file', () => {
  const firstSearchPath = temp.absolutePath('a/b/c/d/e');
  const loadPath = temp.absolutePath('a/b/package.json');

  const checkResult = (readFileSpy: any, result: any) => {
    expect(readFileSpy).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/package.json'),
      config: { foundInB: true },
    });
  };

  test('async', async () => {
    const readFileSpy = vi.spyOn(fsPromises, 'readFile');
    const explorer = cosmiconfig('foo');
    // First pass, prime the cache ...
    await explorer.search(firstSearchPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();

    const result = await explorer.load(loadPath);
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const readFileSpy = vi.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfigSync('foo');
    // First pass, prime the cache ...
    explorer.search(firstSearchPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();

    const result = explorer.load(loadPath);
    checkResult(readFileSpy, result);
  });
});

describe('cache is not used in a new cosmiconfig instance', () => {
  const searchPath = temp.absolutePath('a/b/c/d/e');

  const expectedFilesChecked = [
    'a/b/c/d/e/package.json',
    'a/b/c/d/e/.foorc',
    'a/b/c/d/e/.foorc.json',
    'a/b/c/d/e/.foorc.js',
    'a/b/c/d/e/.foorc.cjs',
    'a/b/c/d/e/.foorc.mjs',
    'a/b/c/d/e/.config/foorc',
    'a/b/c/d/e/.config/foorc.json',
    'a/b/c/d/e/.config/foorc.js',
    'a/b/c/d/e/.config/foorc.cjs',
    'a/b/c/d/e/.config/foorc.mjs',
    'a/b/c/d/e/foo.config.js',
    'a/b/c/d/e/foo.config.cjs',
    'a/b/c/d/e/foo.config.mjs',
    'a/b/c/d/package.json',
    'a/b/c/d/.foorc',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', async () => {
    // First pass, prime the cache ...
    await cosmiconfig('foo', { searchStrategy: 'global' }).search(searchPath);
    // Search again.
    const explorer = cosmiconfig('foo', { searchStrategy: 'global' });
    const readFileSpy = vi.spyOn(fsPromises, 'readFile');
    const result = await explorer.search(searchPath);
    checkResult(readFileSpy, result, expectedFilesChecked);
  });

  test('sync', () => {
    // First pass, prime the cache ...
    cosmiconfigSync('foo', { searchStrategy: 'global' }).search(searchPath);
    // Search again.
    const explorer = cosmiconfigSync('foo', { searchStrategy: 'global' });
    const readFileSpy = vi.spyOn(fs, 'readFileSync');
    const result = explorer.search(searchPath);
    checkResult(readFileSpy, result, expectedFilesChecked.filter(isNotMjs));
  });
});

describe('clears file cache on calling clearLoadCache', () => {
  const loadPath = temp.absolutePath('a/b/c/d/.foorc');

  const checkResult = (readFileSpy: any, result: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(['a/b/c/d/.foorc']);

    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', async () => {
    const readFileSpy = vi.spyOn(fsPromises, 'readFile');
    const explorer = cosmiconfig('foo');
    await explorer.load(loadPath);
    readFileSpy.mockClear();
    explorer.clearLoadCache();

    const result = await explorer.load(loadPath);
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const readFileSpy = vi.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfigSync('foo');
    explorer.load(loadPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();
    explorer.clearLoadCache();

    const result = explorer.load(loadPath);
    checkResult(readFileSpy, result);
  });
});

describe('clears file cache on calling clearCaches', () => {
  const loadPath = temp.absolutePath('a/b/c/d/.foorc');

  const checkResult = (readFileSpy: any, result: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(['a/b/c/d/.foorc']);

    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', async () => {
    const readFileSpy = vi.spyOn(fsPromises, 'readFile');
    const explorer = cosmiconfig('foo');
    await explorer.load(loadPath);
    readFileSpy.mockClear();
    explorer.clearCaches();

    const result = await explorer.load(loadPath);
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const readFileSpy = vi.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfigSync('foo');
    explorer.load(loadPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();
    explorer.clearCaches();
    const result = explorer.load(loadPath);
    checkResult(readFileSpy, result);
  });
});

describe('clears directory cache on calling clearSearchCache', () => {
  const searchPath = temp.absolutePath('a/b/c/d/e');

  const expectedFilesChecked = [
    'a/b/c/d/e/package.json',
    'a/b/c/d/e/.foorc',
    'a/b/c/d/e/.foorc.json',
    'a/b/c/d/e/.foorc.js',
    'a/b/c/d/e/.foorc.cjs',
    'a/b/c/d/e/.foorc.mjs',
    'a/b/c/d/e/.config/foorc',
    'a/b/c/d/e/.config/foorc.json',
    'a/b/c/d/e/.config/foorc.js',
    'a/b/c/d/e/.config/foorc.cjs',
    'a/b/c/d/e/.config/foorc.mjs',
    'a/b/c/d/e/foo.config.js',
    'a/b/c/d/e/foo.config.cjs',
    'a/b/c/d/e/foo.config.mjs',
    'a/b/c/d/package.json',
    'a/b/c/d/.foorc',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', async () => {
    const readFileSpy = vi.spyOn(fsPromises, 'readFile');
    const explorer = cosmiconfig('foo', { searchStrategy: 'global' });
    await explorer.search(searchPath);
    readFileSpy.mockClear();
    explorer.clearSearchCache();

    const result = await explorer.search(searchPath);
    checkResult(readFileSpy, result, expectedFilesChecked);
  });

  test('sync', () => {
    const readFileSpy = vi.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfigSync('foo', { searchStrategy: 'global' });
    explorer.search(searchPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();
    explorer.clearSearchCache();

    const result = explorer.search(searchPath);
    checkResult(readFileSpy, result, expectedFilesChecked.filter(isNotMjs));
  });
});

describe('clears directory cache on calling clearCaches', () => {
  const searchPath = temp.absolutePath('a/b/c/d/e');

  const expectedFilesChecked = [
    'a/b/c/d/e/package.json',
    'a/b/c/d/e/.foorc',
    'a/b/c/d/e/.foorc.json',
    'a/b/c/d/e/.foorc.js',
    'a/b/c/d/e/.foorc.cjs',
    'a/b/c/d/e/.foorc.mjs',
    'a/b/c/d/e/.config/foorc',
    'a/b/c/d/e/.config/foorc.json',
    'a/b/c/d/e/.config/foorc.js',
    'a/b/c/d/e/.config/foorc.cjs',
    'a/b/c/d/e/.config/foorc.mjs',
    'a/b/c/d/e/foo.config.js',
    'a/b/c/d/e/foo.config.cjs',
    'a/b/c/d/e/foo.config.mjs',
    'a/b/c/d/package.json',
    'a/b/c/d/.foorc',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', async () => {
    const readFileSpy = vi.spyOn(fsPromises, 'readFile');
    const explorer = cosmiconfig('foo', { searchStrategy: 'global' });
    await explorer.search(searchPath);
    readFileSpy.mockClear();
    explorer.clearCaches();

    const result = await explorer.search(searchPath);
    checkResult(readFileSpy, result, expectedFilesChecked);
  });

  test('sync', () => {
    const readFileSpy = vi.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfigSync('foo', { searchStrategy: 'global' });
    explorer.search(searchPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();
    explorer.clearCaches();

    const result = explorer.search(searchPath);
    checkResult(readFileSpy, result, expectedFilesChecked.filter(isNotMjs));
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
  const searchPath = temp.absolutePath('a/b/c/d/e');

  const expectedFilesChecked = [
    'a/b/c/d/e/package.json',
    'a/b/c/d/e/.foorc',
    'a/b/c/d/e/.foorc.json',
    'a/b/c/d/e/.foorc.js',
    'a/b/c/d/e/.foorc.cjs',
    'a/b/c/d/e/.foorc.mjs',
    'a/b/c/d/e/.config/foorc',
    'a/b/c/d/e/.config/foorc.json',
    'a/b/c/d/e/.config/foorc.js',
    'a/b/c/d/e/.config/foorc.cjs',
    'a/b/c/d/e/.config/foorc.mjs',
    'a/b/c/d/e/foo.config.js',
    'a/b/c/d/e/foo.config.cjs',
    'a/b/c/d/e/foo.config.mjs',
    'a/b/c/d/package.json',
    'a/b/c/d/.foorc',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', async () => {
    const readFileSpy = vi.spyOn(fsPromises, 'readFile');
    const explorer = cosmiconfig('foo', {
      searchStrategy: 'global',
      cache: false,
    });
    await explorer.search(searchPath);
    readFileSpy.mockClear();

    const result = await explorer.search(searchPath);
    checkResult(readFileSpy, result, expectedFilesChecked);
  });

  test('sync', () => {
    const readFileSpy = vi.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfigSync('foo', {
      searchStrategy: 'global',
      cache: false,
    });
    explorer.search(searchPath);
    readFileSpy.mockClear();

    const result = explorer.search(searchPath);
    checkResult(readFileSpy, result, expectedFilesChecked.filter(isNotMjs));
  });
});

describe('with cache disabled, does not cache file results', () => {
  const loadPath = temp.absolutePath('a/b/c/d/.foorc');

  const checkResult = (readFileSpy: any, result: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(['a/b/c/d/.foorc']);

    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', async () => {
    const readFileSpy = vi.spyOn(fsPromises, 'readFile');
    const explorer = cosmiconfig('foo', { cache: false });
    await explorer.load(loadPath);
    readFileSpy.mockClear();

    const result = await explorer.load(loadPath);
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const readFileSpy = vi.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfigSync('foo', { cache: false });
    explorer.load(loadPath);
    readFileSpy.mockClear();

    const result = explorer.load(loadPath);
    checkResult(readFileSpy, result);
  });
});
