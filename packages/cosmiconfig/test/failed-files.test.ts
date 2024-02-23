import { beforeEach, afterAll, describe, test, expect, vi } from 'vitest';
import { TempDir } from './util';
import { cosmiconfig, cosmiconfigSync } from '../src';

const temp = new TempDir();

beforeEach(() => {
  temp.clean();
});

afterAll(() => {
  // Remove temp.dir created for tests
  temp.deleteTempDir();
});

describe('throws error if defined file does not exist', () => {
  const file = temp.absolutePath('does/not/exist');
  const expectedError = 'ENOENT: no such file or directory';

  test('async', async () => {
    await expect(cosmiconfig('failed-files-tests').load(file)).rejects.toThrow(
      expectedError,
    );
  });

  test('sync', () => {
    expect(() => cosmiconfigSync('failed-files-tests').load(file)).toThrow(
      expectedError,
    );
  });
});

describe('throws error if defined JSON file has syntax error', () => {
  beforeEach(() => {
    temp.createFile('foo-invalid.json', '{ "foo": true: }');
  });

  const file = temp.absolutePath('foo-invalid.json');
  const expectedError = 'JSON Error in';

  test('async', async () => {
    await expect(cosmiconfig('failed-files-tests').load(file)).rejects.toThrow(
      expectedError,
    );
  });

  test('sync', () => {
    expect(() => cosmiconfigSync('failed-files-tests').load(file)).toThrow(
      expectedError,
    );
  });
});

describe('throws error if defined YAML file has syntax error', () => {
  beforeEach(() => {
    temp.createFile('foo-invalid.yaml', 'foo: true: false');
  });

  const file = temp.absolutePath('foo-invalid.yaml');
  const expectedError = `YAML Error in ${file}:\nbad indentation of a mapping entry (1:10)`;

  test('async', async () => {
    await expect(cosmiconfig('failed-files-tests').load(file)).rejects.toThrow(
      expectedError,
    );
  });

  test('sync', () => {
    expect(() => cosmiconfigSync('failed-files-tests').load(file)).toThrow(
      expectedError,
    );
  });
});

describe('throws error if defined JS file has syntax error', () => {
  beforeEach(() => {
    temp.createFile('foo-invalid.js', 'module.exports = { foo }');
  });

  const file = temp.absolutePath('foo-invalid.js');
  const expectedError = 'foo is not defined';

  test('async', async () => {
    await expect(cosmiconfig('failed-files-tests').load(file)).rejects.toThrow(
      expectedError,
    );
  });

  test('sync', () => {
    expect(() => cosmiconfigSync('failed-files-tests').load(file)).toThrow(
      expectedError,
    );
  });
});

describe('throws error if defined TS file has syntax error', () => {
  beforeEach(() => {
    temp.createFile('foo-invalid.ts', 'export default {--}');
  });

  const file = temp.absolutePath('foo-invalid.ts');

  test('async', async () => {
    await expect(
      cosmiconfig('failed-files-tests').load(file),
    ).rejects.toThrow();
  });

  test('sync', () => {
    expect(() => cosmiconfigSync('failed-files-tests').load(file)).toThrow();
  });
});

describe('throws error if defined tsconfig.json file has syntax error', () => {
  beforeEach(() => {
    temp.createFile('foo.ts', 'export default {}');
    temp.createFile('tsconfig.json', 'fdsfko');
  });

  const file = temp.absolutePath('foo.ts');

  test('async', async () => {
    await expect(cosmiconfig('failed-files-tests').load(file)).rejects.toThrow(
      "tsconfig.json: '{' expected.",
    );
  });

  test('sync', () => {
    expect(() => cosmiconfigSync('failed-files-tests').load(file)).toThrow(
      "tsconfig.json: '{' expected.",
    );
  });
});

describe('returns an empty config result for empty file, format JS', () => {
  beforeEach(() => {
    temp.createFile('foo-empty.js', '');
  });

  const file = temp.absolutePath('foo-empty.js');
  const checkResult = (result: any) => {
    expect(result).toEqual({
      config: undefined,
      filepath: file,
      isEmpty: true,
    });
  };

  test('async', async () => {
    const result = await cosmiconfig('failed-files-tests').load(file);
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigSync('failed-files-tests').load(file);
    checkResult(result);
  });
});

describe('returns an empty config result for empty file, format JSON', () => {
  beforeEach(() => {
    temp.createFile('foo-empty.json', '');
  });

  const file = temp.absolutePath('foo-empty.json');
  const checkResult = (result: any) => {
    expect(result).toEqual({
      config: undefined,
      filepath: file,
      isEmpty: true,
    });
  };

  test('async', async () => {
    const result = await cosmiconfig('failed-files-tests').load(file);
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigSync('failed-files-tests').load(file);
    checkResult(result);
  });
});

describe('returns an empty config result for empty file, format YAML', () => {
  beforeEach(() => {
    temp.createFile('foo-empty.yaml', '');
  });

  const file = temp.absolutePath('foo-empty.yaml');
  const checkResult = (result: any) => {
    expect(result).toEqual({
      config: undefined,
      filepath: file,
      isEmpty: true,
    });
  };

  test('async', async () => {
    const result = await cosmiconfig('failed-files-tests').load(file);
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigSync('failed-files-tests').load(file);
    checkResult(result);
  });
});

describe('[#325] transforms & returns null when no config file is found', () => {
  beforeEach(() => {
    // temp.createFile('package.json', '{"name": "failed-files-tests"}');
  });
  const checkTransformResult = vi.fn((result: any) =>
    expect(result).toBeNull(),
  );
  const checkResult = (result: any) => expect(result).toBeNull();

  const startAndStopDir = temp.absolutePath('.');
  test('async', async () => {
    const result = await cosmiconfig('failed-files-tests', {
      searchPlaces: ['package.json'],
      stopDir: startAndStopDir,
      async transform(innerResult) {
        checkTransformResult(innerResult);
        return innerResult;
      },
    }).search(startAndStopDir);
    checkResult(result);
    expect(checkTransformResult).toHaveBeenCalledTimes(1);
  });

  test('sync', () => {
    const result = cosmiconfigSync('failed-files-tests', {
      searchPlaces: ['package.json'],
      stopDir: startAndStopDir,
      transform(innerResult) {
        checkTransformResult(innerResult);
        return innerResult;
      },
    }).search(startAndStopDir);
    checkResult(result);
    expect(checkTransformResult).toHaveBeenCalledTimes(1);
  });
});

describe('errors not swallowed when async custom loader throws them', () => {
  const file = temp.absolutePath('.foorc.things');
  beforeEach(() => {
    temp.createFile('.foorc.things', 'one\ntwo\nthree\t\t\n  four\n');
  });

  const expectedError = new Error('loadThingsAsync error');
  const loadThingsAsync = async () => {
    throw expectedError;
  };

  const explorerOptions = {
    loaders: {
      '.things': loadThingsAsync,
    },
  };

  test('async', async () => {
    await expect(
      cosmiconfig('not_exist_rc_name', explorerOptions).load(file),
    ).rejects.toThrow(expectedError);
  });
});

describe('errors not swallowed when async custom loader rejects', () => {
  const file = temp.absolutePath('.foorc.things');
  beforeEach(() => {
    temp.createFile('.foorc.things', 'one\ntwo\nthree\t\t\n  four\n');
  });

  const expectedError = new Error('loadThingsAsync error');
  const loadThingsAsync = async () => {
    throw expectedError;
  };

  const explorerOptions = {
    loaders: {
      '.things': loadThingsAsync,
    },
  };

  test('async', async () => {
    await expect(
      cosmiconfig('not_exist_rc_name', explorerOptions).load(file),
    ).rejects.toThrow(expectedError);
  });
});

describe('errors if no loader is set for loaded file', () => {
  const file = temp.absolutePath('.foorc.things');
  beforeEach(() => {
    temp.createFile('.foorc.things', 'one\ntwo\nthree\t\t\n  four\n');
  });

  const explorerOptions = {
    loaders: {},
  };

  test('async', async () => {
    await expect(
      cosmiconfig('not_exist_rc_name', explorerOptions).load(file),
    ).rejects.toThrow('No loader specified for extension ".things"');
  });

  test('sync', () => {
    expect(() =>
      cosmiconfigSync('not_exist_rc_name', explorerOptions).load(file),
    ).toThrow('No loader specified for extension ".things"');
  });
});
