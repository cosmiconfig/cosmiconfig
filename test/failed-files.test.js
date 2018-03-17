'use strict';

const path = require('path');
const util = require('./util');
const cosmiconfig = require('../src');

const absolutePath = util.absolutePath;

describe('throws error if defined file does not exist', () => {
  const file = absolutePath('does/not/exist');
  const checkError = error => {
    expect(error.code).toBe('ENOENT');
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig(null)
      .load(file)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig(null, { sync: true }).load(file);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error if defined JSON file has syntax error', () => {
  const file = absolutePath(`fixtures/foo-invalid.json`);
  const checkError = error => {
    expect(error.message).toMatch(/JSON Error/);
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig(null)
      .load(file)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig(null, { sync: true }).load(file);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error if defined YAML file has syntax error', () => {
  const file = absolutePath(`fixtures/foo-invalid.yaml`);
  const checkError = error => {
    expect(error.name).toBe('YAMLException');
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig(null)
      .load(file)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig(null, { sync: true }).load(file);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error if defined JS file has syntax error', () => {
  const file = absolutePath(`fixtures/foo-invalid.js`);
  const checkError = error => {
    expect(error.name).toBe('ReferenceError');
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig(null)
      .load(file)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig(null, { sync: true }).load(file);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('returns an empty config result for empty file, format JS', () => {
  const file = absolutePath(`fixtures/foo-empty.js`);
  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: file,
      isEmpty: true,
    });
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig(null)
      .load(file)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig(null, { sync: true }).load(file);
    checkResult(result);
  });
});

describe('returns an empty config result for empty file, format JSON', () => {
  const file = absolutePath(`fixtures/foo-empty.json`);
  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: file,
      isEmpty: true,
    });
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig(null)
      .load(file)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig(null, { sync: true }).load(file);
    checkResult(result);
  });
});

describe('returns an empty config result for empty file, format YAML', () => {
  const file = absolutePath(`fixtures/foo-empty.yaml`);
  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: file,
      isEmpty: true,
    });
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig(null)
      .load(file)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig(null, { sync: true }).load(file);
    checkResult(result);
  });
});

describe('throws error if defined JSON file has unknown extension', () => {
  const file = absolutePath(`fixtures/foo-invalid-json`);
  const checkError = error => {
    expect(error.message).toMatch(/^Failed to parse/);
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig(null)
      .load(file)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig(null, { sync: true }).load(file);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error if defined YAML file has unknown extension', () => {
  const file = absolutePath(`fixtures/foo-invalid-yaml`);
  const checkError = error => {
    expect(error.message).toMatch(/^Failed to parse/);
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig(null)
      .load(file)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig(null, { sync: true }).load(file);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error if defined JS file has unknown extension', () => {
  const file = absolutePath(`fixtures/foo-invalid-js`);
  const checkError = error => {
    expect(error.message).toMatch(/^Failed to parse/);
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig(null)
      .load(file)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig(null, { sync: true }).load(file);
    } catch (error) {
      checkError(error);
    }
  });
});

test('throws error if configPath is package.json and packageProp is false', () => {
  expect(() =>
    cosmiconfig('foo', { sync: true, packageProp: false }).load(
      path.join(__dirname, 'fixtures/package.json')
    )
  ).toThrow(/Please specify the packageProp option/);
});

test('in async mode, rejects if configPath is package.json and packageProp is false', () => {
  expect.assertions(1);
  return cosmiconfig('foo', { packageProp: false })
    .load(path.join(__dirname, 'fixtures/package.json'))
    .catch(error => {
      expect(error.message).toContain('Please specify the packageProp option');
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
      cosmiconfig('not_exist_rc_name', { sync: true }).load();
    } catch (error) {
      checkError(error);
    }
  });
});
