'use strict';

const util = require('./util');
const resolveDir = require('../lib/resolveDir');

const testFuncsRunner = util.testFuncsRunner;
const testSyncAndAsync = util.testSyncAndAsync;

describe('resolveDir', () => {
  testSyncAndAsync(
    'returns the searchPath if it is a directory',
    sync => () => {
      expect.hasAssertions();
      return testFuncsRunner(sync, resolveDir(__dirname, sync), [
        dir => {
          expect(dir).toBe(__dirname);
        },
      ]);
    }
  );

  testSyncAndAsync(
    'returns the parent directory if it is a file',
    sync => () => {
      expect.hasAssertions();
      return testFuncsRunner(sync, resolveDir(__filename, sync), [
        dir => {
          expect(dir).toBe(__dirname);
        },
      ]);
    }
  );

  it('returns a promise if sync is not true', () => {
    // Although we explicitly pass `false`, the result will be a promise even
    // if a value was not passed, because it would be falsy and not exactly
    // equal to `true`.
    const res = resolveDir(__dirname, false);
    expect(res).toBeInstanceOf(Promise);
  });

  it('propagates error thrown by is-directory in sync', () => {
    expect(() => resolveDir(null, true)).toThrowError(
      'expected filepath to be a string'
    );
  });

  it('rejects with the error thrown by is-directory in async', () => {
    expect.hasAssertions();
    return resolveDir(null, false).catch(err => {
      expect(err.message).toBe('expected filepath to be a string');
    });
  });
});
