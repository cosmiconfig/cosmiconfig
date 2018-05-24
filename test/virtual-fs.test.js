'use strict';

const path = require('path');
const MemoryFileSystem = require('memory-fs');
const cosmiconfig = require('../src');
const util = require('./util');

const fs = new MemoryFileSystem();

const virtualRoot = path.join(path.parse(process.cwd()).root, 'virtual-fs');
const absolutePath = (filename: string) => path.join(virtualRoot, filename);

function createDir(dir: string) {
  fs.mkdirpSync(absolutePath(dir));
}

function createFile(filename: string, contents: string) {
  const filePath = absolutePath(filename);
  const fileDir = path.parse(filePath).dir;
  fs.mkdirpSync(fileDir);
  fs.writeFileSync(filePath, `${contents}\n`);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('with virtual file system', () => {
  beforeEach(() => {
    // reset virtual FS state
    fs.data = {};
  });

  describe('loads defined JSON config path', () => {
    beforeEach(() => {
      createFile('foo.json', '{ "foo": true }');
    });

    const file = absolutePath('foo.json');
    const explorer = cosmiconfig(undefined, { fs });
    const checkResult = result => {
      expect(result.config).toEqual({ foo: true });
      expect(result.filepath).toBe(file);
    };

    test('async', () => {
      expect.hasAssertions();
      return explorer.load(file).then(checkResult);
    });

    test('sync', () => {
      const result = explorer.loadSync(file);
      checkResult(result);
    });
  });

  describe('finds rc file in third searched dir, with a package.json lacking prop', () => {
    beforeEach(() => {
      createDir('a/b/c/d/e/f/');
      createFile('a/b/c/d/package.json', '{ "false": "hope" }');
      createFile('a/b/c/d/.foorc', '{ "found": true }');
    });

    const startDir = absolutePath('a/b/c/d/e/f');
    const explorer = cosmiconfig('foo', { fs, stopDir: absolutePath('.') });

    const checkResult = (readFileSpy, result) => {
      const filesChecked = util.getSpyPathCalls(virtualRoot, readFileSpy);
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
        filepath: absolutePath('a/b/c/d/.foorc'),
      });
    };

    test('async', () => {
      expect.hasAssertions();
      const readFileSpy = jest.spyOn(fs, 'readFile');

      return explorer.search(startDir).then(result => {
        checkResult(readFileSpy, result);
      });
    });

    test('sync', () => {
      const readFileSpy = jest.spyOn(fs, 'readFileSync');
      const result = explorer.searchSync(startDir);
      checkResult(readFileSpy, result);
    });
  });

  describe('throws error if defined file does not exist', () => {
    const file = absolutePath('does/not/exist');
    const explorer = cosmiconfig(undefined, { fs });
    const checkError = error => {
      expect(error.code).toBe('ENOENT');
    };

    test('async', () => {
      expect.hasAssertions();
      return explorer.load(file).catch(checkError);
    });

    test('sync', () => {
      expect.hasAssertions();
      try {
        explorer.loadSync(file);
      } catch (error) {
        checkError(error);
      }
    });
  });

  describe('returns an empty config result for empty file, format JS', () => {
    beforeEach(() => {
      createFile('foo-empty.js', '');
    });

    const file = absolutePath('foo-empty.js');
    const explorer = cosmiconfig(undefined, { fs });
    const checkResult = result => {
      expect(result).toEqual({
        config: undefined,
        filepath: file,
        isEmpty: true,
      });
    };

    test('async', () => {
      expect.hasAssertions();
      return explorer.load(file).then(checkResult);
    });

    test('sync', () => {
      const result = explorer.loadSync(file);
      checkResult(result);
    });
  });

  describe('gives up if it cannot find the file', () => {
    beforeEach(() => {
      createDir('a/b/c/d/e/f/');
    });

    const startDir = absolutePath('a/b');
    const explorer = cosmiconfig('foo', { fs, stopDir: absolutePath('.') });

    const checkResult = (statSpy, readFileSpy, result) => {
      const statPath = util.getSpyPathCalls(virtualRoot, statSpy);
      expect(statPath).toEqual(['a/b']);

      const filesChecked = util.getSpyPathCalls(virtualRoot, readFileSpy);
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
      return explorer.search(startDir).then(result => {
        checkResult(statSpy, readFileSpy, result);
      });
    });

    test('sync', () => {
      const readFileSpy = jest.spyOn(fs, 'readFileSync');
      const statSpy = jest.spyOn(fs, 'statSync');
      const result = explorer.searchSync(startDir);
      checkResult(statSpy, readFileSpy, result);
    });
  });
});
