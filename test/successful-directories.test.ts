import fs from 'fs';
import fsPromises from 'fs/promises';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { cosmiconfig, cosmiconfigSync, Options, OptionsSync } from '../src';
import { defaultLoaders } from '../src/defaults';
import { TempDir, isNotMjs } from './util';

const temp = new TempDir();

function randomString(): string {
  return Math.random().toString(36).substring(7);
}

beforeEach(() => {
  temp.clean();
  temp.createDir('a/b/c/d/e/f/');
});

afterAll(() => {
  // Remove temp.dir created for tests
  temp.deleteTempDir();
});

beforeAll(() => {
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

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.yaml',
    'a/b/c/d/e/f/.foorc.yml',
    'a/b/c/d/e/f/.foorc.js',
    'a/b/c/d/e/f/.foorc.ts',
    'a/b/c/d/e/f/.foorc.cjs',
    'a/b/c/d/e/f/.foorc.mjs',
    'a/b/c/d/e/f/.config/foorc',
    'a/b/c/d/e/f/.config/foorc.json',
    'a/b/c/d/e/f/.config/foorc.yaml',
    'a/b/c/d/e/f/.config/foorc.yml',
    'a/b/c/d/e/f/.config/foorc.js',
    'a/b/c/d/e/f/.config/foorc.ts',
    'a/b/c/d/e/f/.config/foorc.cjs',
    'a/b/c/d/e/f/.config/foorc.mjs',
    'a/b/c/d/e/f/foo.config.js',
    'a/b/c/d/e/f/foo.config.ts',
    'a/b/c/d/e/f/foo.config.cjs',
    'a/b/c/d/e/f/foo.config.mjs',
    'a/b/c/d/e/package.json',
    'a/b/c/d/e/.foorc',
    'a/b/c/d/e/.foorc.json',
    'a/b/c/d/e/.foorc.yaml',
    'a/b/c/d/e/.foorc.yml',
    'a/b/c/d/e/.foorc.js',
    'a/b/c/d/e/.foorc.ts',
    'a/b/c/d/e/.foorc.cjs',
    'a/b/c/d/e/.foorc.mjs',
    'a/b/c/d/e/.config/foorc',
    'a/b/c/d/e/.config/foorc.json',
    'a/b/c/d/e/.config/foorc.yaml',
    'a/b/c/d/e/.config/foorc.yml',
    'a/b/c/d/e/.config/foorc.js',
    'a/b/c/d/e/.config/foorc.ts',
    'a/b/c/d/e/.config/foorc.cjs',
    'a/b/c/d/e/.config/foorc.mjs',
    'a/b/c/d/e/foo.config.js',
    'a/b/c/d/e/foo.config.ts',
    'a/b/c/d/e/foo.config.cjs',
    'a/b/c/d/e/foo.config.mjs',
    'a/b/c/d/package.json',
    'a/b/c/d/.foorc',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
    });
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

describe('finds package.json prop in second searched dir', () => {
  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/package.json',
      '{ "author": "Todd", "foo": { "found": true } }',
    );
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = { stopDir: temp.absolutePath('.') };

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.yaml',
    'a/b/c/d/e/f/.foorc.yml',
    'a/b/c/d/e/f/.foorc.js',
    'a/b/c/d/e/f/.foorc.ts',
    'a/b/c/d/e/f/.foorc.cjs',
    'a/b/c/d/e/f/.foorc.mjs',
    'a/b/c/d/e/f/.config/foorc',
    'a/b/c/d/e/f/.config/foorc.json',
    'a/b/c/d/e/f/.config/foorc.yaml',
    'a/b/c/d/e/f/.config/foorc.yml',
    'a/b/c/d/e/f/.config/foorc.js',
    'a/b/c/d/e/f/.config/foorc.ts',
    'a/b/c/d/e/f/.config/foorc.cjs',
    'a/b/c/d/e/f/.config/foorc.mjs',
    'a/b/c/d/e/f/foo.config.js',
    'a/b/c/d/e/f/foo.config.ts',
    'a/b/c/d/e/f/foo.config.cjs',
    'a/b/c/d/e/f/foo.config.mjs',
    'a/b/c/d/e/package.json',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/package.json'),
    });
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

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.yaml',
    'a/b/c/d/e/f/.foorc.yml',
    'a/b/c/d/e/f/.foorc.js',
    'a/b/c/d/e/f/.foorc.ts',
    'a/b/c/d/e/f/.foorc.cjs',
    'a/b/c/d/e/f/.foorc.mjs',
    'a/b/c/d/e/f/.config/foorc',
    'a/b/c/d/e/f/.config/foorc.json',
    'a/b/c/d/e/f/.config/foorc.yaml',
    'a/b/c/d/e/f/.config/foorc.yml',
    'a/b/c/d/e/f/.config/foorc.js',
    'a/b/c/d/e/f/.config/foorc.ts',
    'a/b/c/d/e/f/.config/foorc.cjs',
    'a/b/c/d/e/f/.config/foorc.mjs',
    'a/b/c/d/e/f/foo.config.js',
    'a/b/c/d/e/f/foo.config.ts',
    'a/b/c/d/e/f/foo.config.cjs',
    'a/b/c/d/e/f/foo.config.mjs',
    'a/b/c/d/e/package.json',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { please: 'no' },
      filepath: temp.absolutePath('a/b/c/d/e/package.json'),
    });
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

describe('finds JS file in first searched dir', () => {
  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/foo.config.js',
      'module.exports = { found: true };',
    );
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = { stopDir: temp.absolutePath('.') };

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.yaml',
    'a/b/c/d/e/f/.foorc.yml',
    'a/b/c/d/e/f/.foorc.js',
    'a/b/c/d/e/f/.foorc.ts',
    'a/b/c/d/e/f/.foorc.cjs',
    'a/b/c/d/e/f/.foorc.mjs',
    'a/b/c/d/e/f/.config/foorc',
    'a/b/c/d/e/f/.config/foorc.json',
    'a/b/c/d/e/f/.config/foorc.yaml',
    'a/b/c/d/e/f/.config/foorc.yml',
    'a/b/c/d/e/f/.config/foorc.js',
    'a/b/c/d/e/f/.config/foorc.ts',
    'a/b/c/d/e/f/.config/foorc.cjs',
    'a/b/c/d/e/f/.config/foorc.mjs',
    'a/b/c/d/e/f/foo.config.js',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);

    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/foo.config.js'),
    });
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
    // Last call is from `require`.
    readFileSpy.mock.calls.pop();
    checkResult(readFileSpy, result, expectedFilesChecked.filter(isNotMjs));
  });
});

describe('finds CJS file in first searched dir', () => {
  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/foo.config.cjs',
      'module.exports = { found: true };',
    );
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = { stopDir: temp.absolutePath('.') };

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.yaml',
    'a/b/c/d/e/f/.foorc.yml',
    'a/b/c/d/e/f/.foorc.js',
    'a/b/c/d/e/f/.foorc.ts',
    'a/b/c/d/e/f/.foorc.cjs',
    'a/b/c/d/e/f/.foorc.mjs',
    'a/b/c/d/e/f/.config/foorc',
    'a/b/c/d/e/f/.config/foorc.json',
    'a/b/c/d/e/f/.config/foorc.yaml',
    'a/b/c/d/e/f/.config/foorc.yml',
    'a/b/c/d/e/f/.config/foorc.js',
    'a/b/c/d/e/f/.config/foorc.ts',
    'a/b/c/d/e/f/.config/foorc.cjs',
    'a/b/c/d/e/f/.config/foorc.mjs',
    'a/b/c/d/e/f/foo.config.js',
    'a/b/c/d/e/f/foo.config.ts',
    'a/b/c/d/e/f/foo.config.cjs',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);

    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/foo.config.cjs'),
    });
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
    // Last call is from `require`.
    readFileSpy.mock.calls.pop();
    checkResult(readFileSpy, result, expectedFilesChecked.filter(isNotMjs));
  });
});

describe('finds ESM foo.config.mjs file in first searched dir', () => {
  // This prefix works around our inability to clear the ESM loader cache.
  const dirPrefix = randomString();
  const startDir = temp.absolutePath(`${dirPrefix}/a/b/c/d/e/f`);
  const explorerOptions = { stopDir: temp.absolutePath('.') };

  const expectedFilesChecked = [
    `${dirPrefix}/a/b/c/d/e/f/package.json`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.json`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.yaml`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.yml`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.js`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.ts`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.cjs`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.mjs`,
    `${dirPrefix}/a/b/c/d/e/f/.config/foorc`,
    `${dirPrefix}/a/b/c/d/e/f/.config/foorc.json`,
    `${dirPrefix}/a/b/c/d/e/f/.config/foorc.yaml`,
    `${dirPrefix}/a/b/c/d/e/f/.config/foorc.yml`,
    `${dirPrefix}/a/b/c/d/e/f/.config/foorc.js`,
    `${dirPrefix}/a/b/c/d/e/f/.config/foorc.ts`,
    `${dirPrefix}/a/b/c/d/e/f/.config/foorc.cjs`,
    `${dirPrefix}/a/b/c/d/e/f/.config/foorc.mjs`,
    `${dirPrefix}/a/b/c/d/e/f/foo.config.js`,
    `${dirPrefix}/a/b/c/d/e/f/foo.config.ts`,
    `${dirPrefix}/a/b/c/d/e/f/foo.config.cjs`,
    `${dirPrefix}/a/b/c/d/e/f/foo.config.mjs`,
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);

    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath(`${dirPrefix}/a/b/c/d/e/f/foo.config.mjs`),
    });
  };

  test('async', async () => {
    temp.createDir(`${dirPrefix}/a/b/c/d/e/f`);
    temp.createFile(
      `${dirPrefix}/a/b/c/d/e/f/foo.config.mjs`,
      'export default { found: true };',
    );

    const readFileSpy = vi.spyOn(fsPromises, 'readFile');

    const result = await cosmiconfig('foo', explorerOptions).search(startDir);
    checkResult(readFileSpy, result, expectedFilesChecked);
  });
});

describe('finds ESM foo.config.js file in first searched dir', () => {
  // This prefix works around our inability to clear the ESM loader cache.
  const dirPrefix = randomString();
  const startDir = temp.absolutePath(`${dirPrefix}/a/b/c/d/e/f`);
  const explorerOptions = { stopDir: temp.absolutePath('.') };

  const expectedFilesChecked = [
    `${dirPrefix}/a/b/c/d/e/f/package.json`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.json`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.yaml`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.yml`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.js`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.ts`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.cjs`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.mjs`,
    `${dirPrefix}/a/b/c/d/e/f/.config/foorc`,
    `${dirPrefix}/a/b/c/d/e/f/.config/foorc.json`,
    `${dirPrefix}/a/b/c/d/e/f/.config/foorc.yaml`,
    `${dirPrefix}/a/b/c/d/e/f/.config/foorc.yml`,
    `${dirPrefix}/a/b/c/d/e/f/.config/foorc.js`,
    `${dirPrefix}/a/b/c/d/e/f/.config/foorc.ts`,
    `${dirPrefix}/a/b/c/d/e/f/.config/foorc.cjs`,
    `${dirPrefix}/a/b/c/d/e/f/.config/foorc.mjs`,
    `${dirPrefix}/a/b/c/d/e/f/foo.config.js`,
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);

    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath(`${dirPrefix}/a/b/c/d/e/f/foo.config.js`),
    });
  };

  // eslint-disable-next-line vitest/no-identical-title
  test('async', async () => {
    temp.createDir(`${dirPrefix}/a/b/c/d/e/f`);
    temp.createFile(
      `${dirPrefix}/a/b/c/d/e/f/foo.config.js`,
      'export default { found: true };',
    );
    temp.createFile(
      `${dirPrefix}/a/b/c/d/e/f/package.json`,
      '{ "type": "module" }',
    );

    const readFileSpy = vi.spyOn(fsPromises, 'readFile');

    const result = await cosmiconfig('foo', explorerOptions).search(startDir);
    checkResult(readFileSpy, result, expectedFilesChecked);
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

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.yaml',
    'a/b/c/d/e/f/.foorc.yml',
    'a/b/c/d/e/f/.foorc.js',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);

    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.js'),
    });
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
    // Last call is from `require`.
    readFileSpy.mock.calls.pop();
    checkResult(readFileSpy, result, expectedFilesChecked.filter(isNotMjs));
  });
});

describe('finds ESM .foorc.mjs file in first searched dir', () => {
  // This prefix works around our inability to clear the ESM loader cache.
  const dirPrefix = randomString();
  const startDir = temp.absolutePath(`${dirPrefix}/a/b/c/d/e/f`);
  const explorerOptions = { stopDir: temp.absolutePath('.') };

  const expectedFilesChecked = [
    `${dirPrefix}/a/b/c/d/e/f/package.json`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.json`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.yaml`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.yml`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.js`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.ts`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.cjs`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.mjs`,
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);

    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath(`${dirPrefix}/a/b/c/d/e/f/.foorc.mjs`),
    });
  };

  test('.foorc.mjs: async', async () => {
    temp.createDir(`${dirPrefix}/a/b/c/d/e/f`);
    temp.createFile(
      `${dirPrefix}/a/b/c/d/e/f/.foorc.mjs`,
      'export default { found: true };',
    );

    const readFileSpy = vi.spyOn(fsPromises, 'readFile');

    const result = await cosmiconfig('foo', explorerOptions).search(startDir);
    checkResult(readFileSpy, result, expectedFilesChecked);
  });
});

describe('finds ESM .foorc.js file in first searched dir', () => {
  // This prefix works around our inability to clear the ESM loader cache.
  const dirPrefix = randomString();
  const startDir = temp.absolutePath(`${dirPrefix}/a/b/c/d/e/f`);
  const explorerOptions = { stopDir: temp.absolutePath('.') };

  const expectedFilesChecked = [
    `${dirPrefix}/a/b/c/d/e/f/package.json`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.json`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.yaml`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.yml`,
    `${dirPrefix}/a/b/c/d/e/f/.foorc.js`,
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);

    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath(`${dirPrefix}/a/b/c/d/e/f/.foorc.js`),
    });
  };

  test('.foorc.js: async', async () => {
    temp.createDir(`${dirPrefix}/a/b/c/d/e/f`);
    temp.createFile(
      `${dirPrefix}/a/b/c/d/e/f/.foorc.js`,
      'export default { found: true };',
    );
    temp.createFile(
      `${dirPrefix}/a/b/c/d/e/f/package.json`,
      '{ "type": "module" }',
    );

    const readFileSpy = vi.spyOn(fsPromises, 'readFile');

    const result = await cosmiconfig('foo', explorerOptions).search(startDir);
    checkResult(readFileSpy, result, expectedFilesChecked);
  });
});

describe('finds .foorc.cjs file in first searched dir', () => {
  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/.foorc.cjs',
      'module.exports = { found: true };',
    );
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = { stopDir: temp.absolutePath('.') };

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.yaml',
    'a/b/c/d/e/f/.foorc.yml',
    'a/b/c/d/e/f/.foorc.js',
    'a/b/c/d/e/f/.foorc.ts',
    'a/b/c/d/e/f/.foorc.cjs',
  ];

  const checkResult = (
    readFileSpy: any,
    result: any,
    expectedResult: Array<string>,
  ) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);

    expect(filesChecked).toEqual(expectedResult);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.cjs'),
    });
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
    // Last call is from `require`.
    readFileSpy.mock.calls.pop();
    checkResult(readFileSpy, result, expectedFilesChecked.filter(isNotMjs));
  });
});

describe("finds foorc file in first searched dir's .config subdir", () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.config/foorc', 'found: true');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = { stopDir: temp.absolutePath('.') };

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.yaml',
    'a/b/c/d/e/f/.foorc.yml',
    'a/b/c/d/e/f/.foorc.js',
    'a/b/c/d/e/f/.foorc.ts',
    'a/b/c/d/e/f/.foorc.cjs',
    'a/b/c/d/e/f/.foorc.mjs',
    'a/b/c/d/e/f/.config/foorc',
  ];

  const checkResult = (
    readFileSpy: any,
    result: any,
    expectedResult: Array<string>,
  ) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);

    expect(filesChecked).toEqual(expectedResult);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/.config/foorc'),
    });
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

describe("finds foorc.json file in first searched dir's .config subdir", () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.config/foorc.json', '{ "found": true }');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = { stopDir: temp.absolutePath('.') };

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.yaml',
    'a/b/c/d/e/f/.foorc.yml',
    'a/b/c/d/e/f/.foorc.js',
    'a/b/c/d/e/f/.foorc.ts',
    'a/b/c/d/e/f/.foorc.cjs',
    'a/b/c/d/e/f/.foorc.mjs',
    'a/b/c/d/e/f/.config/foorc',
    'a/b/c/d/e/f/.config/foorc.json',
  ];

  const checkResult = (
    readFileSpy: any,
    result: any,
    expectedResult: Array<string>,
  ) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);

    expect(filesChecked).toEqual(expectedResult);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/.config/foorc.json'),
    });
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

describe("finds foorc.yaml file in first searched dir's .config subdir", () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.config/foorc.yaml', 'found: true');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = { stopDir: temp.absolutePath('.') };

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.yaml',
    'a/b/c/d/e/f/.foorc.yml',
    'a/b/c/d/e/f/.foorc.js',
    'a/b/c/d/e/f/.foorc.ts',
    'a/b/c/d/e/f/.foorc.cjs',
    'a/b/c/d/e/f/.foorc.mjs',
    'a/b/c/d/e/f/.config/foorc',
    'a/b/c/d/e/f/.config/foorc.json',
    'a/b/c/d/e/f/.config/foorc.yaml',
  ];

  const checkResult = (
    readFileSpy: any,
    result: any,
    expectedResult: Array<string>,
  ) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);

    expect(filesChecked).toEqual(expectedResult);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/.config/foorc.yaml'),
    });
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

describe("finds foorc.yml file in first searched dir's .config subdir", () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.config/foorc.yml', 'found: true');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = { stopDir: temp.absolutePath('.') };

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.yaml',
    'a/b/c/d/e/f/.foorc.yml',
    'a/b/c/d/e/f/.foorc.js',
    'a/b/c/d/e/f/.foorc.ts',
    'a/b/c/d/e/f/.foorc.cjs',
    'a/b/c/d/e/f/.foorc.mjs',
    'a/b/c/d/e/f/.config/foorc',
    'a/b/c/d/e/f/.config/foorc.json',
    'a/b/c/d/e/f/.config/foorc.yaml',
    'a/b/c/d/e/f/.config/foorc.yml',
  ];

  const checkResult = (
    readFileSpy: any,
    result: any,
    expectedResult: Array<string>,
  ) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);

    expect(filesChecked).toEqual(expectedResult);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/.config/foorc.yml'),
    });
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

describe("finds foorc.js file in first searched dir's .config subdir", () => {
  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/.config/foorc.js',
      'module.exports = { found: true };',
    );
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = { stopDir: temp.absolutePath('.') };

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.yaml',
    'a/b/c/d/e/f/.foorc.yml',
    'a/b/c/d/e/f/.foorc.js',
    'a/b/c/d/e/f/.foorc.ts',
    'a/b/c/d/e/f/.foorc.cjs',
    'a/b/c/d/e/f/.foorc.mjs',
    'a/b/c/d/e/f/.config/foorc',
    'a/b/c/d/e/f/.config/foorc.json',
    'a/b/c/d/e/f/.config/foorc.yaml',
    'a/b/c/d/e/f/.config/foorc.yml',
    'a/b/c/d/e/f/.config/foorc.js',
  ];

  const checkResult = (
    readFileSpy: any,
    result: any,
    extectedResult: Array<string>,
  ) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);

    expect(filesChecked).toEqual(extectedResult);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/.config/foorc.js'),
    });
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
    // Last call is from `require`.
    readFileSpy.mock.calls.pop();
    checkResult(readFileSpy, result, expectedFilesChecked.filter(isNotMjs));
  });
});

describe("finds foorc.cjs file in first searched dir's .config subdir", () => {
  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/.config/foorc.cjs',
      'module.exports = { found: true };',
    );
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = { stopDir: temp.absolutePath('.') };

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.yaml',
    'a/b/c/d/e/f/.foorc.yml',
    'a/b/c/d/e/f/.foorc.js',
    'a/b/c/d/e/f/.foorc.ts',
    'a/b/c/d/e/f/.foorc.cjs',
    'a/b/c/d/e/f/.foorc.mjs',
    'a/b/c/d/e/f/.config/foorc',
    'a/b/c/d/e/f/.config/foorc.json',
    'a/b/c/d/e/f/.config/foorc.yaml',
    'a/b/c/d/e/f/.config/foorc.yml',
    'a/b/c/d/e/f/.config/foorc.js',
    'a/b/c/d/e/f/.config/foorc.ts',
    'a/b/c/d/e/f/.config/foorc.cjs',
  ];

  const checkResult = (
    readFileSpy: any,
    result: any,
    extectedResult: Array<string>,
  ) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);

    expect(filesChecked).toEqual(extectedResult);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/.config/foorc.cjs'),
    });
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
    // Last call is from `require`.
    readFileSpy.mock.calls.pop();
    checkResult(readFileSpy, result, expectedFilesChecked.filter(isNotMjs));
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

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.yaml',
    'a/b/c/d/e/f/.foorc.yml',
    'a/b/c/d/e/f/.foorc.js',
    'a/b/c/d/e/f/.foorc.ts',
    'a/b/c/d/e/f/.foorc.cjs',
    'a/b/c/d/e/f/.foorc.mjs',
    'a/b/c/d/e/f/.config/foorc',
    'a/b/c/d/e/f/.config/foorc.json',
    'a/b/c/d/e/f/.config/foorc.yaml',
    'a/b/c/d/e/f/.config/foorc.yml',
    'a/b/c/d/e/f/.config/foorc.js',
    'a/b/c/d/e/f/.config/foorc.ts',
    'a/b/c/d/e/f/.config/foorc.cjs',
    'a/b/c/d/e/f/.config/foorc.mjs',
    'a/b/c/d/e/f/foo.config.js',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);

    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/foo.config.js'),
    });
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
    // Last call is from `require`.
    readFileSpy.mock.calls.pop();
    checkResult(readFileSpy, result, expectedFilesChecked.filter(isNotMjs));
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

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.wowza',
    'a/b/c/d/e/f/wowzaConfig.js',
    'a/b/c/d/e/package.json',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/package.json'),
    });
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

describe('finds rc file in third searched dir, skipping packageProp, parsing extensionless files as JSON', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/.foorc', '{ "found": true }');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    loaders: {
      noExt: defaultLoaders['.json'],
    },
    searchPlaces: ['.foorc', 'foo.config.js'],
  };

  const expectedFilesChecked = [
    'a/b/c/d/e/f/.foorc',
    'a/b/c/d/e/f/foo.config.js',
    'a/b/c/d/e/.foorc',
    'a/b/c/d/e/foo.config.js',
    'a/b/c/d/.foorc',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
    });
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

describe('finds package.json file in second searched dir, skipping JS and RC files', () => {
  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/package.json',
      '{ "author": "Todd", "foo": { "found": true } }',
    );
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    searchStrategy: 'global',
    searchPlaces: ['package.json'],
  } satisfies Partial<Options | OptionsSync>;

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/package.json',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/package.json'),
    });
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

describe('finds .foorc.json in second searched dir', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/.foorc.json', '{ "found": true }');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
  };

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.yaml',
    'a/b/c/d/e/f/.foorc.yml',
    'a/b/c/d/e/f/.foorc.js',
    'a/b/c/d/e/f/.foorc.ts',
    'a/b/c/d/e/f/.foorc.cjs',
    'a/b/c/d/e/f/.foorc.mjs',
    'a/b/c/d/e/f/.config/foorc',
    'a/b/c/d/e/f/.config/foorc.json',
    'a/b/c/d/e/f/.config/foorc.yaml',
    'a/b/c/d/e/f/.config/foorc.yml',
    'a/b/c/d/e/f/.config/foorc.js',
    'a/b/c/d/e/f/.config/foorc.ts',
    'a/b/c/d/e/f/.config/foorc.cjs',
    'a/b/c/d/e/f/.config/foorc.mjs',
    'a/b/c/d/e/f/foo.config.js',
    'a/b/c/d/e/f/foo.config.ts',
    'a/b/c/d/e/f/foo.config.cjs',
    'a/b/c/d/e/f/foo.config.mjs',
    'a/b/c/d/e/package.json',
    'a/b/c/d/e/.foorc',
    'a/b/c/d/e/.foorc.json',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/.foorc.json'),
    });
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

describe('finds .foorc.yaml in first searched dir', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.yaml', 'found: true');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
  };

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.yaml',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.yaml'),
    });
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

describe('finds .foorc.yml in first searched dir', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.yml', 'found: true');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
  };

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.yaml',
    'a/b/c/d/e/f/.foorc.yml',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.yml'),
    });
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
      '.foorc.cjs',
      'foo.config.cjs',
      '.foorc.js',
      'foo.config.js',
      'myfooconfig.js',
    ],
  };

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.yaml',
    'a/b/c/d/e/f/.foorc.yml',
    'a/b/c/d/e/f/.foorc.cjs',
    'a/b/c/d/e/f/foo.config.cjs',
    'a/b/c/d/e/f/.foorc.js',
    'a/b/c/d/e/f/foo.config.js',
    'a/b/c/d/e/f/myfooconfig.js',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/myfooconfig.js'),
    });
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
    // Last call is from `require`.
    readFileSpy.mock.calls.pop();
    checkResult(readFileSpy, result, expectedFilesChecked.filter(isNotMjs));
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

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.yaml',
    'a/b/c/d/e/f/.foorc.yml',
    'a/b/c/d/e/f/.foorc.js',
    'a/b/c/d/e/f/.foorc.ts',
    'a/b/c/d/e/f/.foorc.cjs',
    'a/b/c/d/e/f/.foorc.mjs',
    'a/b/c/d/e/f/.config/foorc',
    'a/b/c/d/e/f/.config/foorc.json',
    'a/b/c/d/e/f/.config/foorc.yaml',
    'a/b/c/d/e/f/.config/foorc.yml',
    'a/b/c/d/e/f/.config/foorc.js',
    'a/b/c/d/e/f/.config/foorc.ts',
    'a/b/c/d/e/f/.config/foorc.cjs',
    'a/b/c/d/e/f/.config/foorc.mjs',
    'a/b/c/d/e/f/foo.config.js',
    'a/b/c/d/e/f/foo.config.ts',
    'a/b/c/d/e/f/foo.config.cjs',
    'a/b/c/d/e/f/foo.config.mjs',
    'a/b/c/d/e/package.json',
    'a/b/c/d/e/.foorc',
    'a/b/c/d/e/.foorc.json',
    'a/b/c/d/e/.foorc.yaml',
    'a/b/c/d/e/.foorc.yml',
    'a/b/c/d/e/.foorc.js',
    'a/b/c/d/e/.foorc.ts',
    'a/b/c/d/e/.foorc.cjs',
    'a/b/c/d/e/.foorc.mjs',
    'a/b/c/d/e/.config/foorc',
    'a/b/c/d/e/.config/foorc.json',
    'a/b/c/d/e/.config/foorc.yaml',
    'a/b/c/d/e/.config/foorc.yml',
    'a/b/c/d/e/.config/foorc.js',
    'a/b/c/d/e/.config/foorc.ts',
    'a/b/c/d/e/.config/foorc.cjs',
    'a/b/c/d/e/.config/foorc.mjs',
    'a/b/c/d/e/foo.config.js',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/foo.config.js'),
    });
  };

  test('async', async () => {
    const explorer = cosmiconfig('foo', explorerOptions);

    const readFileSpy = vi.spyOn(fsPromises, 'readFile');
    const result = await explorer.search();
    checkResult(readFileSpy, result, expectedFilesChecked);
  });

  test('sync', () => {
    const explorer = cosmiconfigSync('foo', explorerOptions);

    const readFileSpy = vi.spyOn(fs, 'readFileSync');
    const result = explorer.search();
    // Last call is from `require`.
    readFileSpy.mock.calls.pop();
    checkResult(readFileSpy, result, expectedFilesChecked.filter(isNotMjs));
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

  const expectedFilesChecked = [
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.config/.foorc.json',
    'a/b/c/d/e/f/.config/foo/config.json',
    'a/b/c/d/e/.foorc.json',
    'a/b/c/d/e/package.json',
    'a/b/c/d/e/.config/.foorc.json',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/b/c/d/e/.config/.foorc.json'),
    });
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

describe('directories with the same name as a search place are not treated as files', () => {
  beforeEach(() => {
    temp.createFile('a/.foorc.json', '{ "found": true }');
    temp.createDir('a/b/package.json/c');
  });

  const startDir = temp.absolutePath('a/b/package.json/c');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: ['package.json', '.foorc.json'],
  };

  const checkResult = (readFileSpy: any, result: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual([
      'a/b/package.json/c/package.json',
      'a/b/package.json/c/.foorc.json',
      'a/b/package.json/package.json',
      'a/b/package.json/.foorc.json',
      'a/b/package.json',
      'a/b/.foorc.json',
      'a/package.json',
      'a/.foorc.json',
    ]);

    expect(result).toEqual({
      config: { found: true },
      filepath: temp.absolutePath('a/.foorc.json'),
    });
  };

  test('async', async () => {
    const explorer = cosmiconfig('foo', explorerOptions);

    const readFileSpy = vi.spyOn(fsPromises, 'readFile');
    const result = await explorer.search(startDir);
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const explorer = cosmiconfigSync('foo', explorerOptions);

    const readFileSpy = vi.spyOn(fs, 'readFileSync');
    const result = explorer.search(startDir);
    checkResult(readFileSpy, result);
  });
});

describe('custom loaders allow non-default file types', () => {
  const loadThings = (filepath: any, content: any) => {
    return {
      things: content
        .split('\n')
        .map((x: any) => x.trim())
        .filter((x: any) => !!x),
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

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.yml',
    'a/b/c/d/e/f/.foorc.things',
    'a/b/c/d/e/f/.foorc.grumbly',
    'a/b/c/d/e/package.json',
    'a/b/c/d/e/.foorc.json',
    'a/b/c/d/e/.foorc.yml',
    'a/b/c/d/e/.foorc.things',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { things: ['one', 'two', 'three', 'four'] },
      filepath: temp.absolutePath('a/b/c/d/e/.foorc.things'),
    });
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

describe('adding custom loaders allows for default and non-default file types', () => {
  const loadThings = (filepath: any, content: any) => {
    return {
      things: content
        .split('\n')
        .map((x: any) => x.trim())
        .filter((x: any) => !!x),
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

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/.foorc.yml',
    'a/b/c/d/e/f/.foorc.things',
    'a/b/c/d/e/f/.foorc.grumbly',
    'a/b/c/d/e/package.json',
    'a/b/c/d/e/.foorc.json',
    'a/b/c/d/e/.foorc.yml',
    'a/b/c/d/e/.foorc.things',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { things: ['one', 'two', 'three', 'four'] },
      filepath: temp.absolutePath('a/b/c/d/e/.foorc.things'),
    });
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
      'foo.config.cjs',
      'foo.config.js',
      'foo.config.ts',
      '.foorc.yml',
    ],
    loaders: {
      '.js': loadGrumbly,
    },
  };

  const expectedFilesChecked = [
    'a/b/c/d/e/f/package.json',
    'a/b/c/d/e/f/.foorc.json',
    'a/b/c/d/e/f/foo.config.cjs',
    'a/b/c/d/e/f/foo.config.js',
    'a/b/c/d/e/f/foo.config.ts',
    'a/b/c/d/e/f/.foorc.yml',
    'a/b/c/d/e/package.json',
    'a/b/c/d/e/.foorc.json',
    'a/b/c/d/e/foo.config.cjs',
    'a/b/c/d/e/foo.config.js',
  ];

  const checkResult = (readFileSpy: any, result: any, files: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(files);

    expect(result).toEqual({
      config: { grumbly: true },
      filepath: temp.absolutePath('a/b/c/d/e/foo.config.js'),
    });
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

describe('custom loaders can be async', () => {
  const startDir = temp.absolutePath('a/b/c/d/e/f');

  let loadThingsSync: any;
  let loadThingsAsync: any;
  const baseOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: ['.foorc.things'],
  };

  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/.foorc.things',
      'one\ntwo\nthree\t\t\n  four\n',
    );

    loadThingsSync = vi.fn(() => ({ things: true }));
    loadThingsAsync = vi.fn(async () => ({ things: true }));
  });

  const checkResult = (readFileSpy: any, result: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(['a/b/c/d/e/f/.foorc.things']);

    expect(result).toEqual({
      config: { things: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.things'),
    });
  };

  test('async', async () => {
    const explorerOptions = {
      ...baseOptions,
      loaders: {
        '.things': loadThingsAsync,
      },
    };
    const explorer = cosmiconfig('foo', explorerOptions);

    const readFileSpy = vi.spyOn(fsPromises, 'readFile');
    const result = await explorer.search(startDir);
    expect(loadThingsSync).not.toHaveBeenCalled();
    expect(loadThingsAsync).toHaveBeenCalled();
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const explorerOptions = {
      ...baseOptions,
      loaders: {
        '.things': loadThingsSync,
      },
    };
    const explorer = cosmiconfigSync('foo', explorerOptions);

    const readFileSpy = vi.spyOn(fs, 'readFileSync');
    const result = explorer.search(startDir);
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

  const loadThingsAsync = async () => ({ things: true });

  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: ['.foorc.things'],
    loaders: {
      '.things': loadThingsAsync,
    },
  };

  const checkResult = (readFileSpy: any, result: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(['a/b/c/d/e/f/.foorc.things']);

    expect(result).toEqual({
      config: { things: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.things'),
    });
  };

  test('async', async () => {
    const explorer = cosmiconfig('foo', explorerOptions);

    const readFileSpy = vi.spyOn(fsPromises, 'readFile');
    const result = await explorer.search(startDir);
    checkResult(readFileSpy, result);
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
      '.things': loadThingsSync,
    },
  };

  const checkResult = (readFileSpy: any, result: any) => {
    const filesChecked = temp.getSpyPathCalls(readFileSpy);
    expect(filesChecked).toEqual(['a/b/c/d/e/f/.foorc.things']);

    expect(result).toEqual({
      config: { things: true },
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.things'),
    });
  };

  test('async', async () => {
    const explorer = cosmiconfig('foo', explorerOptions);

    const readFileSpy = vi.spyOn(fsPromises, 'readFile');
    const result = await explorer.search(startDir);
    checkResult(readFileSpy, result);
  });

  test('sync', () => {
    const explorer = cosmiconfigSync('foo', explorerOptions);

    const readFileSpy = vi.spyOn(fs, 'readFileSync');
    const result = explorer.search(startDir);
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

  test('sync', async () => {
    const result = cosmiconfigSync('bar', explorerOptions).search(startDir);
    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/e/f/bar.config.js'),
      config: expect.any(Promise),
    });

    if (result === null) {
      throw new Error('is null');
    }

    const resolvedConfig = await result.config;
    expect(resolvedConfig).toEqual({ a: 1 });
  });
});
