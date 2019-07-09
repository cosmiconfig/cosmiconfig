import fs from 'fs';
import importFreshActual from 'import-fresh';
import { TempDir } from './util';
import { cosmiconfig } from '../src';

// mocks are hoisted
jest.mock('import-fresh');

const importFreshMock = importFreshActual as typeof importFreshActual &
  jest.Mock;

const temp = new TempDir();

beforeEach(() => {
  temp.clean();
  temp.createDir('a/b/c/d/e/f/');
  temp.createFile('a/b/c/d/package.json', '{ "false": "hope" }');
  temp.createFile('a/b/c/d/.foorc', '{ "foundInD": true }');
  temp.createFile('a/b/package.json', '{ "foo": { "foundInB": true } }');
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(() => {
  // Remove temp.dir created for tests
  temp.deleteTempDir();
});

describe('cache is not used initially', () => {
  const searchPath = temp.absolutePath('a/b/c/d/e');
  const checkResult = (readFileSpy: any, result: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
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
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', async () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const cachedSearch = cosmiconfig('foo').search;
    const result = await cachedSearch(searchPath);
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const cachedSearchSync = cosmiconfig('foo').searchSync;
    const result = cachedSearchSync(searchPath);
    checkResult(readFileSpy, result);
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
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const cachedSearch = cosmiconfig('foo').search;
    // First pass, prime the cache ...
    await cachedSearch(searchPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();

    const result = await cachedSearch(searchPath);
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const cachedSearchSync = cosmiconfig('foo').searchSync;
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
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const cachedLoad = cosmiconfig('foo').load;
    // First pass, prime the cache ...
    await cachedLoad(loadPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();

    const result = await cachedLoad(loadPath);
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const cachedLoadSync = cosmiconfig('foo').loadSync;
    // First pass, prime the cache ...
    cachedLoadSync(loadPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();

    const result = cachedLoadSync(loadPath);
    checkResult(readFileSpy, result);
  });
});

describe('cache is used when some directories in search are already visted', () => {
  const firstSearchPath = temp.absolutePath('a/b/c/d/e');
  const secondSearchPath = temp.absolutePath('a/b/c/d/e/f');
  const checkResult = (readFileSpy: any, result: any) => {
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
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', async () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const cachedSearch = cosmiconfig('foo').search;
    // First pass, prime the cache ...
    await cachedSearch(firstSearchPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();

    const result = await cachedSearch(secondSearchPath);
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const cachedSearchSync = cosmiconfig('foo').searchSync;
    // First pass, prime the cache ...
    cachedSearchSync(firstSearchPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();

    const result = cachedSearchSync(secondSearchPath);
    checkResult(readFileSpy, result);
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
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const explorer = cosmiconfig('foo');
    // First pass, prime the cache ...
    await explorer.search(firstSearchPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();

    const result = await explorer.load(loadPath);
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfig('foo');
    // First pass, prime the cache ...
    explorer.searchSync(firstSearchPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();

    const result = explorer.loadSync(loadPath);
    checkResult(readFileSpy, result);
  });
});

describe('cache is not used in a new cosmiconfig instance', () => {
  const searchPath = temp.absolutePath('a/b/c/d/e');
  const checkResult = (readFileSpy: any, result: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
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
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', async () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    // First pass, prime the cache ...
    await cosmiconfig('foo').search(searchPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();

    const result = await cosmiconfig('foo').search(searchPath);
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    // First pass, prime the cache ...
    cosmiconfig('foo').searchSync(searchPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();

    const result = cosmiconfig('foo').searchSync(searchPath);
    checkResult(readFileSpy, result);
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
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const explorer = cosmiconfig('foo');
    await explorer.load(loadPath);
    readFileSpy.mockClear();
    explorer.clearLoadCache();

    const result = await explorer.load(loadPath);
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfig('foo');
    explorer.loadSync(loadPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();
    explorer.clearLoadCache();

    const result = explorer.loadSync(loadPath);
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
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const explorer = cosmiconfig('foo');
    await explorer.load(loadPath);
    readFileSpy.mockClear();
    explorer.clearCaches();

    const result = await explorer.load(loadPath);
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfig('foo');
    explorer.loadSync(loadPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();
    explorer.clearCaches();
    const result = explorer.loadSync(loadPath);
    checkResult(readFileSpy, result);
  });
});

describe('clears directory cache on calling clearSearchCache', () => {
  const searchPath = temp.absolutePath('a/b/c/d/e');
  const checkResult = (readFileSpy: any, result: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
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
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', async () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const explorer = cosmiconfig('foo');
    await explorer.search(searchPath);
    readFileSpy.mockClear();
    explorer.clearSearchCache();

    const result = await explorer.search(searchPath);
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfig('foo');
    explorer.searchSync(searchPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();
    explorer.clearSearchCache();

    const result = explorer.searchSync(searchPath);
    checkResult(readFileSpy, result);
  });
});

describe('clears directory cache on calling clearCaches', () => {
  const searchPath = temp.absolutePath('a/b/c/d/e');
  const checkResult = (readFileSpy: any, result: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
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
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', async () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const explorer = cosmiconfig('foo');
    await explorer.search(searchPath);
    readFileSpy.mockClear();
    explorer.clearCaches();

    const result = await explorer.search(searchPath);
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfig('foo');
    explorer.searchSync(searchPath);
    // Reset readFile mocks and search again.
    readFileSpy.mockClear();
    explorer.clearCaches();

    const result = explorer.searchSync(searchPath);
    checkResult(readFileSpy, result);
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
  const checkResult = (readFileSpy: any, result: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
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
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', async () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const explorer = cosmiconfig('foo', { cache: false });
    await explorer.search(searchPath);
    readFileSpy.mockClear();

    const result = await explorer.search(searchPath);
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfig('foo', { cache: false });
    explorer.searchSync(searchPath);
    readFileSpy.mockClear();

    const result = explorer.searchSync(searchPath);
    checkResult(readFileSpy, result);
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
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const explorer = cosmiconfig('foo', { cache: false });
    await explorer.load(loadPath);
    readFileSpy.mockClear();

    const result = await explorer.load(loadPath);
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfig('foo', { cache: false });
    explorer.loadSync(loadPath);
    readFileSpy.mockClear();

    const result = explorer.loadSync(loadPath);
    checkResult(readFileSpy, result);
  });
});

describe('ensure import-fresh is called when loading a js file', () => {
  const tempFileName = 'a/b/c/d/.foorc.js';
  const loadPath = temp.absolutePath(tempFileName);

  beforeEach(() => {
    importFreshMock.mockReturnValue({ foundJs: true });
  });

  const checkResult = (result: any) => {
    expect(importFreshMock).toHaveBeenCalledTimes(1);
    expect(importFreshMock).toHaveBeenCalledWith(loadPath);

    expect(result.config).toEqual({ foundJs: true });
  };

  test('async', async () => {
    const explorer = cosmiconfig('foo');
    temp.createFile(tempFileName, 'module.exports = { foundJs: true };');

    const result = await explorer.load(loadPath);
    checkResult(result);
  });

  test('sync', () => {
    const explorer = cosmiconfig('foo');
    temp.createFile(tempFileName, 'module.exports = { foundJs: true };');

    const result = explorer.loadSync(loadPath);
    checkResult(result);
  });
});
