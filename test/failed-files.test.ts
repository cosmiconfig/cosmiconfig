import { TempDir } from './util';
import { cosmiconfig } from '../src';

const temp = new TempDir();

beforeEach(() => {
  temp.clean();
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(() => {
  // Remove temp.dir created for tests
  temp.deleteTempDir();
});

describe('throws error if defined file does not exist', () => {
  const file = temp.absolutePath('does/not/exist');
  const checkError = (error: any) => {
    expect(error.code).toBe('ENOENT');
  };

  test('async', async () => {
    expect.hasAssertions();
    try {
      await cosmiconfig('failed-files-tests').load(file);
    } catch (error) {
      checkError(error);
    }
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('failed-files-tests').loadSync(file);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error if defined JSON file has syntax error', () => {
  beforeEach(() => {
    temp.createFile('foo-invalid.json', '{ "foo": true: }');
  });

  const file = temp.absolutePath('foo-invalid.json');
  const checkError = (error: any) => {
    expect(error.message).toMatch(/JSON Error/);
  };

  test('async', async () => {
    expect.hasAssertions();
    try {
      await cosmiconfig('failed-files-tests').load(file);
    } catch (error) {
      checkError(error);
    }
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('failed-files-tests').loadSync(file);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error if defined YAML file has syntax error', () => {
  beforeEach(() => {
    temp.createFile('foo-invalid.yaml', 'foo: true: false');
  });

  const file = temp.absolutePath('foo-invalid.yaml');
  const checkError = (error: any) => {
    expect(error.name).toBe('YAMLException');
  };

  test('async', async () => {
    expect.hasAssertions();
    try {
      await cosmiconfig('failed-files-tests').load(file);
    } catch (error) {
      checkError(error);
    }
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('failed-files-tests').loadSync(file);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error if defined JS file has syntax error', () => {
  beforeEach(() => {
    temp.createFile('foo-invalid.js', 'module.exports = { foo }');
  });

  const file = temp.absolutePath('foo-invalid.js');
  const checkError = (error: any) => {
    expect(error.name).toBe('ReferenceError');
  };

  test('async', async () => {
    expect.hasAssertions();
    try {
      await cosmiconfig('failed-files-tests').load(file);
    } catch (error) {
      checkError(error);
    }
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('failed-files-tests').loadSync(file);
    } catch (error) {
      checkError(error);
    }
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
    const result = cosmiconfig('failed-files-tests').loadSync(file);
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
    const result = cosmiconfig('failed-files-tests').loadSync(file);
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
    const result = cosmiconfig('failed-files-tests').loadSync(file);
    checkResult(result);
  });
});

describe('throws an error if no configPath was specified and load is called without an argument', () => {
  const checkError = (error: any) => {
    expect(error.message).toMatch(/non-empty string/);
  };

  test('async', async () => {
    expect.hasAssertions();
    try {
      // @ts-ignore
      await cosmiconfig('not_exist_rc_name').load();
    } catch (error) {
      checkError(error);
    }
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      // @ts-ignore
      cosmiconfig('not_exist_rc_name').loadSync();
    } catch (error) {
      checkError(error);
    }
  });
});

describe('errors not swallowed when async custom loader throws them', () => {
  const file = temp.absolutePath('.foorc.things');
  beforeEach(() => {
    temp.createFile('.foorc.things', 'one\ntwo\nthree\t\t\n  four\n');
  });

  const expectedError = new Error();
  const loadThingsAsync = async () => {
    throw expectedError;
  };

  const explorerOptions = {
    loaders: {
      '.things': { async: loadThingsAsync },
    },
  };

  const checkError = (error: any) => {
    expect(error).toBe(expectedError);
  };

  test('async', async () => {
    expect.hasAssertions();
    try {
      await cosmiconfig('not_exist_rc_name', explorerOptions).load(file);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('errors not swallowed when async custom loader rejects', () => {
  const file = temp.absolutePath('.foorc.things');
  beforeEach(() => {
    temp.createFile('.foorc.things', 'one\ntwo\nthree\t\t\n  four\n');
  });

  const expectedError = new Error();
  const loadThingsAsync = async () => {
    throw expectedError;
  };

  const explorerOptions = {
    loaders: {
      '.things': { async: loadThingsAsync },
    },
  };

  const checkError = (error: any) => {
    expect(error).toBe(expectedError);
  };

  test('async', async () => {
    expect.hasAssertions();
    try {
      await cosmiconfig('not_exist_rc_name', explorerOptions).load(file);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('errors if only async loader is set but you call sync search', () => {
  const file = temp.absolutePath('.foorc.things');
  beforeEach(() => {
    temp.createFile('.foorc.things', 'one\ntwo\nthree\t\t\n  four\n');
  });

  const loadThingsAsync = async () => ({ things: true });

  const explorerOptions = {
    loaders: {
      '.things': { async: loadThingsAsync },
    },
  };

  const checkError = (error: any) => {
    expect(error.message).toMatch(
      /No sync loader specified for extension "\.things"/,
    );
  };

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('not_exist_rc_name', explorerOptions).loadSync(file);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('errors if no loader is set but you call sync load', () => {
  const file = temp.absolutePath('.foorc.things');
  beforeEach(() => {
    temp.createFile('.foorc.things', 'one\ntwo\nthree\t\t\n  four\n');
  });

  const explorerOptions = {
    loaders: {},
  };

  const checkError = (error: any) => {
    expect(error.message).toMatch(
      /No sync loader specified for extension "\.things"/,
    );
  };

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('not_exist_rc_name', explorerOptions).loadSync(file);
    } catch (error) {
      checkError(error);
    }
  });
});
