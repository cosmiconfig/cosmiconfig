import { getDirectory, getDirectorySync } from '../src/getDirectory';

describe('returns the searchPath if it is a directory', () => {
  const subject = __dirname;
  const checkResult = (result: any) => {
    expect(result).toBe(subject);
  };

  test('async', async () => {
    return getDirectory(subject).then(checkResult);
  });

  test('sync', () => {
    checkResult(getDirectorySync(subject));
  });
});

describe('returns the parent directory if it is a file', () => {
  const subject = __filename;
  const checkResult = (result: any) => {
    expect(result).toBe(__dirname);
  };

  test('async', async () => {
    return getDirectory(subject).then(checkResult);
  });

  test('sync', () => {
    checkResult(getDirectorySync(subject));
  });
});

test('returns a promise if sync is not true', async () => {
  // Although we explicitly pass `false`, the result will be a promise even
  // if a value was not passed, because it would be falsy and not exactly
  // equal to `true`.
  const res = getDirectory(__dirname);
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  expect(res).toBeInstanceOf(Promise);

  return res;
});

test('propagates error thrown by is-directory in sync', () => {
  // @ts-ignore
  expect(() => getDirectorySync(null)).toThrow(
    'expected filepath to be a string',
  );
});

test('rejects with the error thrown by is-directory in async', async () => {
  expect.hasAssertions();
  // @ts-ignore
  return getDirectory(null).catch((err): any => {
    expect(err.message).toBe('expected filepath to be a string');
  });
});
