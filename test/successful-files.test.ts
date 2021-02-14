import { TempDir } from './util';
import { cosmiconfig, cosmiconfigSync } from '../src';
import { canUseDynamicImport } from '../src/canUseDynamicImport';

const temp = new TempDir();

const describeEsmOnly = canUseDynamicImport() ? describe : describe.skip;

function randomString(): string {
  return Math.random().toString(36).substring(7);
}

beforeEach(() => {
  temp.clean();
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
  const checkResult = (result: any) => {
    expect(result.config).toEqual({ foo: true });
    expect(result.filepath).toBe(file);
  };

  test('async', async () => {
    const result = await cosmiconfig('successful-files-tests').load(file);
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigSync('successful-files-tests').load(file);
    checkResult(result);
  });
});

describe('loads defined YAML config path', () => {
  beforeEach(() => {
    temp.createFile('foo.yaml', 'foo: true');
  });

  const file = temp.absolutePath('foo.yaml');
  const checkResult = (result: any) => {
    expect(result.config).toEqual({ foo: true });
    expect(result.filepath).toBe(file);
  };

  test('async', async () => {
    const result = await cosmiconfig('successful-files-tests').load(file);
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigSync('successful-files-tests').load(file);
    checkResult(result);
  });
});

describe('loads defined JS config path', () => {
  beforeEach(() => {
    temp.createFile('foo.js', 'module.exports = { foo: true };');
  });

  const file = temp.absolutePath('foo.js');
  const checkResult = (result: any) => {
    expect(result.config).toEqual({ foo: true });
    expect(result.filepath).toBe(file);
  };

  test('async', async () => {
    const result = await cosmiconfig('successful-files-tests').load(file);
    checkResult(result);
  });
});

describeEsmOnly(
  'loads ESM from defined .js config path (nearest package.json says it is ESM)',
  () => {
    // Random basename works around our inability to clear the ESM loader cache.
    const fileBasename = `${randomString()}.js`;
    const file = temp.absolutePath(fileBasename);
    const checkResult = (result: any) => {
      expect(result.config).toEqual({ foo: true });
      expect(result.filepath).toBe(file);
    };

    beforeEach(() => {
      temp.createFile('package.json', '{ "type": "module" }');
      temp.createFile(fileBasename, 'export default { foo: true };');
    });

    test('async', async () => {
      const result = await cosmiconfig('successful-files-tests').load(file);
      checkResult(result);
    });
  },
);

describe('loads CommonJS with its own dependency', () => {
  beforeEach(() => {
    temp.createFile('foo.js', 'module.exports = { foo: true };');
    temp.createFile('foo-module.js', 'module.exports = require("./foo");');
  });

  const file = temp.absolutePath('foo-module.js');
  const checkResult = (result: any) => {
    expect(result.config).toEqual({ foo: true });
    expect(result.filepath).toBe(file);
  };

  test('async', async () => {
    const result = await cosmiconfig('successful-files-tests').load(file);
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigSync('successful-files-tests').load(file);
    checkResult(result);
  });
});

describeEsmOnly('loads ESM with its own dependency', () => {
  // Random basename works around our inability to clear the ESM loader cache.
  const depFileBasename = `${randomString()}.mjs`;
  const fileBasename = `${randomString()}.mjs`;
  const file = temp.absolutePath(fileBasename);
  const checkResult = (result: any) => {
    expect(result.config).toEqual({ foo: true });
    expect(result.filepath).toBe(file);
  };

  beforeEach(() => {
    temp.createFile(depFileBasename, 'export default { foo: true };');
    temp.createFile(
      fileBasename,
      `import config from "./${depFileBasename}"; export default config;`,
    );
  });

  test('async', async () => {
    const result = await cosmiconfig('successful-files-tests').load(file);
    checkResult(result);
  });
});

describe('loads yaml-like JS config path', () => {
  beforeEach(() => {
    temp.createFile('foo-yaml-like.js', 'module.exports = { foo: true };');
  });

  const file = temp.absolutePath('foo-yaml-like.js');
  const checkResult = (result: any) => {
    expect(result.config).toEqual({ foo: true });
    expect(result.filepath).toBe(file);
  };

  test('async', async () => {
    const result = await cosmiconfig('successful-files-tests').load(file);
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigSync('successful-files-tests').load(file);
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
    }`,
    );
  });

  const configPath = temp.absolutePath('package.json');
  const checkResult = (result: any, expectedConfig: any) => {
    expect(result.config).toEqual(expectedConfig);
    expect(result.filepath).toBe(configPath);
  };

  describe('default package prop', () => {
    const expectedConfig = { bar: 'baz' };

    test('async', async () => {
      const result = await cosmiconfig('foo').load(configPath);
      checkResult(result, expectedConfig);
    });

    test('sync', () => {
      const result = cosmiconfigSync('foo').load(configPath);
      checkResult(result, expectedConfig);
    });
  });

  describe('specified packageProp', () => {
    const expectedConfig = { please: 'no' };
    const explorerOptions = { packageProp: 'otherPackage' };

    test('async', async () => {
      const result = await cosmiconfig('foo', explorerOptions).load(configPath);
      checkResult(result, expectedConfig);
    });

    test('sync', () => {
      const result = cosmiconfigSync('foo', explorerOptions).load(configPath);
      checkResult(result, expectedConfig);
    });
  });

  describe('nested packageProp', () => {
    const expectedConfig = 'baz';
    const explorerOptions = { packageProp: 'foo.bar' };

    test('async', async () => {
      const result = await cosmiconfig('foo', explorerOptions).load(configPath);
      checkResult(result, expectedConfig);
    });

    test('sync', () => {
      const result = cosmiconfigSync('foo', explorerOptions).load(configPath);
      checkResult(result, expectedConfig);
    });
  });

  describe('inaccurate packageProp returns undefined, does not error', () => {
    const options = { packageProp: 'otherrrPackage' };
    test('async', async () => {
      const result = await cosmiconfig('foo', options).load(configPath);
      expect(result).toBeNull();
    });

    test('sync', () => {
      const result = cosmiconfigSync('foo', options).load(configPath);
      expect(result).toBeNull();
    });
  });

  describe('inaccurate nested packageProp returns undefined, does not error', () => {
    const options = { packageProp: 'foo.baz' };
    test('async', async () => {
      const result = await cosmiconfig('foo', options).load(configPath);
      expect(result).toBeNull();
    });

    test('sync', () => {
      const result = cosmiconfigSync('foo', options).load(configPath);
      expect(result).toBeNull();
    });
  });
});

describe('runs transform', () => {
  beforeEach(() => {
    temp.createFile('foo.json', '{ "foo": true }');
  });

  const configPath = temp.absolutePath('foo.json');
  const transform = (result: any) => {
    result.config.foo = [result.config.foo];
    return result;
  };
  const checkResult = (result: any) => {
    expect(result.config).toEqual({ foo: [true] });
  };

  test('async', async () => {
    const result = await cosmiconfig('successful-files-tests', {
      transform,
    }).load(configPath);
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigSync('successful-files-tests', {
      transform,
    }).load(configPath);
    checkResult(result);
  });
});

describe('does not swallow transform errors', () => {
  beforeEach(() => {
    temp.createFile('foo.json', '{ "foo": true }');
  });

  const configPath = temp.absolutePath('foo.json');
  const expectedError = new Error('These pretzels are making me thirsty!');
  const transform = () => {
    throw expectedError;
  };

  test('async', async () => {
    await expect(
      cosmiconfig('successful-files-tests', { transform }).load(configPath),
    ).rejects.toThrow(expectedError);
  });

  test('sync', () => {
    expect(() =>
      cosmiconfigSync('successful-files-tests', { transform }).load(configPath),
    ).toThrow(expectedError);
  });
});

describe('loads defined JSON file with no extension', () => {
  beforeEach(() => {
    temp.createFile('foo-valid-json', '{ "json": true }');
  });

  const file = temp.absolutePath('foo-valid-json');
  const checkResult = (result: any) => {
    expect(result.config).toEqual({ json: true });
    expect(result.filepath).toBe(file);
  };

  test('async', async () => {
    const result = await cosmiconfig('successful-files-tests').load(file);
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigSync('successful-files-tests').load(file);
    checkResult(result);
  });
});

describe('loads defined YAML file with no extension', () => {
  beforeEach(() => {
    temp.createFile('foo-valid-yaml', 'yaml: true');
  });

  const file = temp.absolutePath('foo-valid-yaml');
  const checkResult = (result: any) => {
    expect(result.config).toEqual({ yaml: true });
    expect(result.filepath).toBe(file);
  };

  test('async', async () => {
    const result = await cosmiconfig('successful-files-tests').load(file);
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigSync('successful-files-tests').load(file);
    checkResult(result);
  });
});

describe('custom loaders can be async', () => {
  let loadThingsSync: any;
  let loadThingsAsync: any;
  beforeEach(() => {
    temp.createFile('.foorc.things', 'one\ntwo\nthree\t\t\n  four\n');
    loadThingsSync = jest.fn(() => ({ things: true }));
    loadThingsAsync = jest.fn(async () => ({ things: true }));
  });

  const file = temp.absolutePath('.foorc.things');
  const checkResult = (result: any) => {
    expect(result.config).toEqual({ things: true });
    expect(result.filepath).toBe(file);
  };

  test('async', async () => {
    const explorerOptions = {
      loaders: {
        '.things': loadThingsAsync,
      },
    };

    const result = await cosmiconfig('foo', explorerOptions).load(file);
    checkResult(result);
  });

  test('sync', () => {
    const explorerOptions = {
      loaders: {
        '.things': loadThingsSync,
      },
    };

    const result = cosmiconfigSync('foo', explorerOptions).load(file);
    checkResult(result);
  });
});

describe('a custom loader entry can include just an async loader', () => {
  beforeEach(() => {
    temp.createFile('.foorc.things', 'one\ntwo\nthree\t\t\n  four\n');
  });

  const loadThingsAsync = async () => ({ things: true });

  const explorerOptions = {
    loaders: {
      '.things': loadThingsAsync,
    },
  };

  const file = temp.absolutePath('.foorc.things');
  const checkResult = (result: any) => {
    expect(result.config).toEqual({ things: true });
    expect(result.filepath).toBe(file);
  };

  test('async', async () => {
    const result = await cosmiconfig('foo', explorerOptions).load(file);
    checkResult(result);
  });
});

describe('a custom loader entry can include only a sync loader and work for both sync and async functions', () => {
  beforeEach(() => {
    temp.createFile('.foorc.things', 'one\ntwo\nthree\t\t\n  four\n');
  });

  const loadThingsSync = () => {
    return { things: true };
  };

  const explorerOptions = {
    loaders: {
      '.things': loadThingsSync,
    },
  };

  const file = temp.absolutePath('.foorc.things');
  const checkResult = (result: any) => {
    expect(result.config).toEqual({ things: true });
    expect(result.filepath).toBe(file);
  };

  test('async', async () => {
    const result = await cosmiconfig('foo', explorerOptions).load(file);
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigSync('foo', explorerOptions).load(file);
    checkResult(result);
  });
});

describe('works fine if sync loader returns a Promise from a JS file', () => {
  beforeEach(() => {
    temp.createFile(
      'foo.config.js',
      'module.exports = Promise.resolve({ a: 1 });',
    );
  });

  const file = temp.absolutePath('foo.config.js');
  const explorerOptions = {
    stopDir: temp.absolutePath('.'),
    searchPlaces: ['foo.config.js'],
  };

  test('sync', async () => {
    const result = cosmiconfigSync('foo', explorerOptions).load(file);
    expect(result).toEqual({
      filepath: file,
      config: expect.any(Promise),
    });

    if (result === null) {
      throw new Error('test is broken');
    }

    const resolvedConfig = await result.config;
    expect(resolvedConfig).toEqual({ a: 1 });
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
  const checkResult = (result: any) => {
    expect(result.config).toEqual({ bar: true });
    expect(result.filepath).toBe(absoluteFile);
  };

  test('async', async () => {
    const result = await cosmiconfig('successful-files-tests').load(
      relativeFile,
    );
    checkResult(result);
  });

  test('sync', () => {
    const result = cosmiconfigSync('successful-files-tests').load(relativeFile);
    checkResult(result);
  });
});
