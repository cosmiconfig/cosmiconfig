import { getDirectory } from '../src/getDirectory';

describe('returns the searchPath if it is a directory', () => {
  const subject = __dirname;
  const checkResult = (result: any) => {
    expect(result).toBe(subject);
  };

  test('async', () => {
    return getDirectory(subject).then(checkResult);
  });

  test('sync', () => {
    checkResult(getDirectory.sync(subject));
  });
});

describe('returns the parent directory if it is a file', () => {
  const subject = __filename;
  const checkResult = (result: any) => {
    expect(result).toBe(__dirname);
  };

  test('async', () => {
    return getDirectory(subject).then(checkResult);
  });

  test('sync', () => {
    checkResult(getDirectory.sync(subject));
  });
});

test('returns a promise if sync is not true', () => {
  // Although we explicitly pass `false`, the result will be a promise even
  // if a value was not passed, because it would be falsy and not exactly
  // equal to `true`.
  const res = getDirectory(__dirname);
  expect(res).toBeInstanceOf(Promise);
});

test('propagates error thrown by is-directory in sync', () => {
  // @ts-ignore
  expect(() => getDirectory.sync(null)).toThrow(
    'expected filepath to be a string',
  );
});

test('rejects with the error thrown by is-directory in async', () => {
  expect.hasAssertions();
  // @ts-ignore
  return getDirectory(null).catch((err): any => {
    expect(err.message).toBe('expected filepath to be a string');
  });
});
