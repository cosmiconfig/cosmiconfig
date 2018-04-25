'use strict';

const util = require('./util');
const cosmiconfig = require('../src');

const temp = new util.TempDir();

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
  const checkError = error => {
    expect(error.code).toBe('ENOENT');
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig()
      .load(file)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig().loadSync(file);
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
  const checkError = error => {
    expect(error.message).toMatch(/JSON Error/);
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig()
      .load(file)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig().loadSync(file);
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
  const checkError = error => {
    expect(error.name).toBe('YAMLException');
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig()
      .load(file)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig().loadSync(file);
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
  const checkError = error => {
    expect(error.name).toBe('ReferenceError');
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig()
      .load(file)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig().loadSync(file);
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
  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: file,
      isEmpty: true,
    });
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig()
      .load(file)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig().loadSync(file);
    checkResult(result);
  });
});

describe('returns an empty config result for empty file, format JSON', () => {
  beforeEach(() => {
    temp.createFile('foo-empty.json', '');
  });

  const file = temp.absolutePath('foo-empty.json');
  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: file,
      isEmpty: true,
    });
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig()
      .load(file)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig().loadSync(file);
    checkResult(result);
  });
});

describe('returns an empty config result for empty file, format YAML', () => {
  beforeEach(() => {
    temp.createFile('foo-empty.yaml', '');
  });

  const file = temp.absolutePath('foo-empty.yaml');
  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: file,
      isEmpty: true,
    });
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig()
      .load(file)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig().loadSync(file);
    checkResult(result);
  });
});

describe('throws error if defined JSON file has unknown extension', () => {
  beforeEach(() => {
    temp.createFile('foo-invalid-json', '{ "foo": true: }');
  });

  const file = temp.absolutePath('foo-invalid-json');
  const checkError = error => {
    expect(error.message).toMatch(/^Failed to parse/);
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig()
      .load(file)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig().loadSync(file);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error if defined YAML file has unknown extension', () => {
  beforeEach(() => {
    temp.createFile('foo-invalid-yaml', 'foo: true: false');
  });

  const file = temp.absolutePath('foo-invalid-yaml');
  const checkError = error => {
    expect(error.message).toMatch(/^Failed to parse/);
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig()
      .load(file)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig().loadSync(file);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error if configPath is package.json and packageProp is false', () => {
  beforeEach(() => {
    temp.createFile('package.json', '{ "foo": { "bar": "baz" } }');
  });

  const file = temp.absolutePath('package.json');
  const checkError = error => {
    expect(error.message).toMatch(/^Please specify the packageProp option/);
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('foo', { packageProp: false })
      .load(file)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('foo', { packageProp: false }).loadSync(file);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws an error if no configPath was specified and load is called without an argument', () => {
  const checkError = error => {
    expect(error.message).toMatch(/^configPath must be a nonempty string/);
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('not_exist_rc_name')
      .load()
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('not_exist_rc_name').loadSync();
    } catch (error) {
      checkError(error);
    }
  });
});
