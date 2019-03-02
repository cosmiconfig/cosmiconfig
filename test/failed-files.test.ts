'use strict';

import util = require('./util');
import cosmiconfig = require('../src');

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

describe('throws an error if no configPath was specified and load is called without an argument', () => {
  const checkError = error => {
    expect(error.message).toMatch(/non-empty string/);
  };

  test('async', () => {
    expect.hasAssertions();
    // @ts-ignore
    return cosmiconfig('not_exist_rc_name')
      .load()
      .catch(checkError);
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
  const loadThingsAsync = () => {
    throw expectedError;
  };

  const explorerOptions = {
    loaders: {
      '.things': { async: loadThingsAsync },
    },
  };

  const checkError = error => {
    expect(error).toBe(expectedError);
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('not_exist_rc_name', explorerOptions)
      .load(file)
      .catch(checkError);
  });
});

describe('errors not swallowed when async custom loader rejects', () => {
  const file = temp.absolutePath('.foorc.things');
  beforeEach(() => {
    temp.createFile('.foorc.things', 'one\ntwo\nthree\t\t\n  four\n');
  });

  const expectedError = new Error();
  const loadThingsAsync = () => {
    return Promise.reject(expectedError);
  };

  const explorerOptions = {
    loaders: {
      '.things': { async: loadThingsAsync },
    },
  };

  const checkError = error => {
    expect(error).toBe(expectedError);
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('not_exist_rc_name', explorerOptions)
      .load(file)
      .catch(checkError);
  });
});

describe('errors if only async loader is set but you call sync search', () => {
  const file = temp.absolutePath('.foorc.things');
  beforeEach(() => {
    temp.createFile('.foorc.things', 'one\ntwo\nthree\t\t\n  four\n');
  });

  const loadThingsAsync = () => {
    return Promise.resolve({ things: true });
  };

  const explorerOptions = {
    loaders: {
      '.things': { async: loadThingsAsync },
    },
  };

  const checkError = error => {
    expect(error.message).toMatch(
      /No sync loader specified for extension "\.things"/
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

  const checkError = error => {
    expect(error.message).toMatch(
      /No sync loader specified for extension "\.things"/
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
