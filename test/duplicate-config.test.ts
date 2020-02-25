import { TempDir } from './util';
import { cosmiconfig, cosmiconfigSync } from '../src';

const temp = new TempDir();

beforeEach(() => {
  temp.clean();
  temp.createDir('a/b/c/d/e/f/');
});

afterAll(() => {
  // Remove temp.dir created for tests
  temp.deleteTempDir();
});

describe('returns an empty config result for an empty config file', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.js', '');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    breakOnDuplicateConfig: true,
    stopDir: temp.absolutePath('a'),
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
    expect(result).toEqual(null);
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

describe('returns config for a single config file', () => {
  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/.foorc.js',
      'module.exports = { "foo": "bar" }',
    );
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    breakOnDuplicateConfig: true,
    stopDir: temp.absolutePath('a'),
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
      config: { foo: 'bar' },
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.js'),
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

describe('throws error for multiple config files', () => {
  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/.foorc.js',
      'module.exports = { "foo": "bar" }',
    );
    temp.createFile('a/b/c/d/e/f/.foorc.json', '{ "foo": "bar" }');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    breakOnDuplicateConfig: true,
    stopDir: temp.absolutePath('a'),
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

  const expectedError = /Duplicate configuration detected in ".*\/a\/b\/c\/d\/e\/f\/\.foorc\.json" and ".*\/a\/b\/c\/d\/e\/f\/\.foorc\.js"/;

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

describe('throws error for multiple config files in different directories', () => {
  beforeEach(() => {
    temp.createFile(
      'a/b/c/d/e/f/.foorc.js',
      'module.exports = { "foo": "bar" }',
    );
    temp.createFile('a/b/c/d/e/.foorc.json', '{ "foo": "bar" }');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');
  const explorerOptions = {
    breakOnDuplicateConfig: true,
    stopDir: temp.absolutePath('a'),
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

  const expectedError = /Duplicate configuration detected in ".*\/a\/b\/c\/d\/e\/f\/\.foorc\.js" and ".*\/a\/b\/c\/d\/e\/\.foorc\.json"/;

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
