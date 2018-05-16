'use strict';

const fs = require('fs');
const getDirectory = require('../src/getDirectory');

describe('returns the searchPath if it is a directory', () => {
  const subject = __dirname;
  const checkResult = result => {
    expect(result).toBe(subject);
  };

  test('async', () => {
    return getDirectory(fs, subject, false).then(checkResult);
  });

  test('sync', () => {
    checkResult(getDirectory.sync(fs, subject, true));
  });
});

describe('returns the parent directory if it is a file', () => {
  const subject = __filename;
  const checkResult = result => {
    expect(result).toBe(__dirname);
  };

  test('async', () => {
    return getDirectory(fs, subject, false).then(checkResult);
  });

  test('sync', () => {
    checkResult(getDirectory.sync(fs, subject, true));
  });
});

test('returns a promise if sync is not true', () => {
  // Although we explicitly pass `false`, the result will be a promise even
  // if a value was not passed, because it would be falsy and not exactly
  // equal to `true`.
  const res = getDirectory(fs, __dirname, false);
  expect(res).toBeInstanceOf(Promise);
});

test('propagates error thrown by is-directory in sync', () => {
  expect(() => getDirectory.sync(fs, null, true)).toThrowError(
    'expected filepath to be a string'
  );
});

test('rejects with the error thrown by is-directory in async', () => {
  expect.hasAssertions();
  return getDirectory(fs, null, false).catch(err => {
    expect(err.message).toBe('expected filepath to be a string');
  });
});
