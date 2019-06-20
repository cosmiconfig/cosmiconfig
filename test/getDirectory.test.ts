import path from 'path';
import {
  getDirectoryAsync as getDirectoryAsyncActual,
  getDirectorySync as getDirectorySyncActual,
} from '../src/getDirectory';

const getDirectoryAsync: typeof getDirectoryAsyncActual = (...params) =>
  require('../src/getDirectory').getDirectoryAsync(...params);

const getDirectorySync: typeof getDirectorySyncActual = (...params) =>
  require('../src/getDirectory').getDirectorySync(...params);

describe('returns the searchPath if it is a directory', () => {
  const subject = __dirname;
  const checkResult = (result: string) => {
    expect(result).toBe(subject);
  };

  test('async', () => {
    return getDirectoryAsync(subject).then(checkResult);
  });

  test('sync', () => {
    checkResult(getDirectorySync(subject));
  });
});

describe('returns the parent directory if it is a file', () => {
  const subject = __filename;
  const checkResult = (result: string) => {
    expect(result).toBe(__dirname);
  };

  test('async', () => {
    return getDirectoryAsync(subject).then(checkResult);
  });

  test('sync', () => {
    checkResult(getDirectorySync(subject));
  });
});

// https://github.com/davidtheclark/cosmiconfig/issues/63
describe('handles process.cwd()/stdin', () => {
  const subject = path.join(process.cwd(), 'stdin');
  const checkResult = (result: string) => {
    expect(result).toBe(process.cwd());
  };

  test('async', () => {
    return getDirectoryAsync(subject).then(checkResult);
  });

  test('sync', () => {
    checkResult(getDirectorySync(subject));
  });
});

test('returns a promise if sync is not true', () => {
  // Although we explicitly pass `false`, the result will be a promise even
  // if a value was not passed, because it would be falsy and not exactly
  // equal to `true`.
  const res = getDirectoryAsync(__dirname);
  expect(res).toBeInstanceOf(Promise);
});

test('propagates error thrown by is-directory in sync', () => {
  // @ts-ignore
  expect(() => getDirectorySync(null)).toThrow('Expected a string, got object');
});

test('rejects with the error thrown by is-directory in async', () => {
  expect.hasAssertions();

  // @ts-ignore
  return getDirectoryAsync(null).catch((err) => {
    expect(err.message).toBe('Expected a string, got object');
  });
});
