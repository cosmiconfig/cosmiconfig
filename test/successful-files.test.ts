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

describe('loads defined JSON config path', () => {
  beforeEach(() => {
    temp.createFile('foo.json', '{ "foo": true }');
  });

  const file = temp.absolutePath('foo.json');
  const checkResult = result => {
    expect(result.config).toEqual({ foo: true });
    expect(result.filepath).toBe(file);
  };

  test('async', () => {
    return cosmiconfig()
      .load(file)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig().loadSync(file);
    checkResult(result);
  });
});

describe('loads defined YAML config path', () => {
  beforeEach(() => {
    temp.createFile('foo.yaml', 'foo: true');
  });

  const file = temp.absolutePath('foo.yaml');
  const checkResult = result => {
    expect(result.config).toEqual({ foo: true });
    expect(result.filepath).toBe(file);
  };

  test('async', () => {
    return cosmiconfig()
      .load(file)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig().loadSync(file);
    checkResult(result);
  });
});

describe('loads defined JS config path', () => {
  beforeEach(() => {
    temp.createFile('foo.js', 'module.exports = { foo: true };');
  });

  const file = temp.absolutePath('foo.js');
  const checkResult = result => {
    expect(result.config).toEqual({ foo: true });
    expect(result.filepath).toBe(file);
  };

  test('async', () => {
    return cosmiconfig()
      .load(file)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig().loadSync(file);
    checkResult(result);
  });
});

describe('loads modularized JS config path', () => {
  beforeEach(() => {
    temp.createFile('foo.js', 'module.exports = { foo: true };');
    temp.createFile('foo-module.js', 'module.exports = require("./foo");');
  });

  const file = temp.absolutePath('foo-module.js');
  const checkResult = result => {
    expect(result.config).toEqual({ foo: true });
    expect(result.filepath).toBe(file);
  };

  test('async', () => {
    return cosmiconfig()
      .load(file)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig().loadSync(file);
    checkResult(result);
  });
});

describe('loads yaml-like JS config path', () => {
  beforeEach(() => {
    temp.createFile('foo-yaml-like.js', 'module.exports = { foo: true };');
  });

  const file = temp.absolutePath('foo-yaml-like.js');
  const checkResult = result => {
    expect(result.config).toEqual({ foo: true });
    expect(result.filepath).toBe(file);
  };

  test('async', () => {
    return cosmiconfig()
      .load(file)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig().loadSync(file);
    checkResult(result);
  });
});

describe('loads package prop when configPath is package.json', () => {
  beforeEach(() => {
    temp.createFile(
      'package.json',
      `{
      "foo": {
        "bar": "baz"
      },
      "otherPackage": {
        "please": "no"
      }
    }`
    );
  });

  const configPath = temp.absolutePath('package.json');
  const checkResult = (result, expectedConfig) => {
    expect(result.config).toEqual(expectedConfig);
    expect(result.filepath).toBe(configPath);
  };

  describe('default package prop', () => {
    const explorer = cosmiconfig('foo');
    const expectedConfig = { bar: 'baz' };

    test('async', () => {
      return explorer
        .load(configPath)
        .then(result => checkResult(result, expectedConfig));
    });

    test('sync', () => {
      const result = explorer.loadSync(configPath);
      checkResult(result, expectedConfig);
    });
  });

  describe('specified packageProp', () => {
    const explorer = cosmiconfig('foo', { packageProp: 'otherPackage' });
    const expectedConfig = { please: 'no' };

    test('async', () => {
      return explorer
        .load(configPath)
        .then(result => checkResult(result, expectedConfig));
    });

    test('sync', () => {
      const result = explorer.loadSync(configPath);
      checkResult(result, expectedConfig);
    });
  });

  describe('nested packageProp', () => {
    const explorer = cosmiconfig('foo', { packageProp: 'foo.bar' });
    const expectedConfig = 'baz';

    test('async', () => {
      return explorer
        .load(configPath)
        .then(result => checkResult(result, expectedConfig));
    });

    test('sync', () => {
      const result = explorer.loadSync(configPath);
      checkResult(result, expectedConfig);
    });
  });

  describe('inaccurate packageProp returns undefined, does not error', () => {
    const explorer = cosmiconfig('foo', { packageProp: 'otherrrPackage' });

    test('async', () => {
      return explorer
        .load(configPath)
        .then(result => expect(result).toBeNull());
    });

    test('sync', () => {
      const result = explorer.loadSync(configPath);
      expect(result).toBeNull();
    });
  });

  describe('inaccurate nested packageProp returns undefined, does not error', () => {
    const explorer = cosmiconfig('foo', { packageProp: 'foo.baz' });

    test('async', () => {
      return explorer
        .load(configPath)
        .then(result => expect(result).toBeNull());
    });

    test('sync', () => {
      const result = explorer.loadSync(configPath);
      expect(result).toBeNull();
    });
  });
});

describe('runs transform', () => {
  beforeEach(() => {
    temp.createFile('foo.json', '{ "foo": true }');
  });

  const configPath = temp.absolutePath('foo.json');
  const transform = result => {
    result.config.foo = [result.config.foo];
    return result;
  };
  const checkResult = result => {
    expect(result.config).toEqual({ foo: [true] });
  };

  test('async', () => {
    return cosmiconfig(null, { transform })
      .load(configPath)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig(null, { transform }).loadSync(configPath);
    checkResult(result);
  });
});

describe('does not swallow transform errors', () => {
  beforeEach(() => {
    temp.createFile('foo.json', '{ "foo": true }');
  });

  const configPath = temp.absolutePath('foo.json');
  const transform = () => {
    throw new Error('These pretzels are making me thirsty!');
  };

  const checkError = error => {
    expect(error.message).toBe('These pretzels are making me thirsty!');
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig(null, { transform })
      .load(configPath)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig(null, { transform }).loadSync(configPath);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('loads defined JSON file with no extension', () => {
  beforeEach(() => {
    temp.createFile('foo-valid-json', '{ "json": true }');
  });

  const file = temp.absolutePath('foo-valid-json');
  const checkResult = result => {
    expect(result.config).toEqual({ json: true });
    expect(result.filepath).toBe(file);
  };

  test('async', () => {
    return cosmiconfig()
      .load(file)
      .then(result => {
        checkResult(result);
      });
  });

  test('sync', () => {
    const result = cosmiconfig().loadSync(file);
    checkResult(result);
  });
});

describe('loads defined YAML file with no extension', () => {
  beforeEach(() => {
    temp.createFile('foo-valid-yaml', 'yaml: true');
  });

  const file = temp.absolutePath('foo-valid-yaml');
  const checkResult = result => {
    expect(result.config).toEqual({ yaml: true });
    expect(result.filepath).toBe(file);
  };

  test('async', () => {
    return cosmiconfig()
      .load(file)
      .then(result => {
        checkResult(result);
      });
  });

  test('sync', () => {
    const result = cosmiconfig().loadSync(file);
    checkResult(result);
  });
});

describe('custom loaders can be async', () => {
  let loadThingsSync;
  let loadThingsAsync;
  let explorerOptions;
  beforeEach(() => {
    temp.createFile('.foorc.things', 'one\ntwo\nthree\t\t\n  four\n');
    loadThingsSync = jest.fn(() => {
      return { things: true };
    });
    loadThingsAsync = jest.fn(() => {
      return Promise.resolve({ things: true });
    });
    explorerOptions = {
      loaders: {
        '.things': { sync: loadThingsSync, async: loadThingsAsync },
      },
    };
  });

  const file = temp.absolutePath('.foorc.things');
  const checkResult = result => {
    expect(result.config).toEqual({ things: true });
    expect(result.filepath).toBe(file);
  };

  test('async', () => {
    return cosmiconfig('foo', explorerOptions)
      .load(file)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig('foo', explorerOptions).loadSync(file);
    checkResult(result);
  });
});

describe('a custom loader entry can include just an async loader', () => {
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

  const file = temp.absolutePath('.foorc.things');
  const checkResult = result => {
    expect(result.config).toEqual({ things: true });
    expect(result.filepath).toBe(file);
  };

  test('async', () => {
    return cosmiconfig('foo', explorerOptions)
      .load(file)
      .then(checkResult);
  });
});

describe('a custom loader entry can include only a sync loader and work for both sync and async functions', () => {
  beforeEach(() => {
    temp.createFile('.foorc.things', 'one\ntwo\nthree\t\t\n  four\n');
  });

  const loadThingsAsync = () => {
    return { things: true };
  };

  const explorerOptions = {
    loaders: {
      '.things': { sync: loadThingsAsync },
    },
  };

  const file = temp.absolutePath('.foorc.things');
  const checkResult = result => {
    expect(result.config).toEqual({ things: true });
    expect(result.filepath).toBe(file);
  };

  test('async', () => {
    return cosmiconfig('foo', explorerOptions)
      .load(file)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig('foo', explorerOptions).loadSync(file);
    checkResult(result);
  });
});

describe('works fine if sync loader returns a Promise from a JS file', () => {
  beforeEach(() => {
    temp.createFile(
      'foo.config.js',
      'module.exports = Promise.resolve({ a: 1 });'
    );
  });

  const file = temp.absolutePath('foo.config.js');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: ['foo.config.js'],
  };

  test('sync', () => {
    const result = cosmiconfig('foo', explorerOptions).loadSync(file);
    expect(result).toEqual({
      filepath: file,
      config: expect.any(Promise),
    });
    return result!.config.then(resolved => {
      expect(resolved).toEqual({ a: 1 });
    });
  });
});

describe('loads defined JS config relative path', () => {
  const currentDir = process.cwd();
  beforeEach(() => {
    temp.createFile('config/bar.js', 'module.exports = { bar: true };');
    process.chdir(temp.dir);
  });
  afterEach(() => {
    process.chdir(currentDir);
  });

  const relativeFile = './config/bar.js';
  const absoluteFile = temp.absolutePath(relativeFile);
  const checkResult = result => {
    expect(result.config).toEqual({ bar: true });
    expect(result.filepath).toBe(absoluteFile);
  };

  test('async', () => {
    return cosmiconfig()
      .load(relativeFile)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig().loadSync(relativeFile);
    checkResult(result);
  });
});
