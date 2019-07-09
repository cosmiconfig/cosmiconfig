import path from 'path';
import { getDirectory, getDirectorySync } from '../src/getDirectory';

describe('returns the searchPath if it is a directory', () => {
  const subject = __dirname;
  const checkResult = (result: any) => {
    expect(result).toBe(subject);
  };

  test('async', async () => {
    const result = await getDirectory(subject);
    checkResult(result);
  });

  test('sync', () => {
    const result = getDirectorySync(subject);
    checkResult(result);
  });
});

describe('returns the parent directory if it is a file', () => {
  const subject = __filename;
  const checkResult = (result: any) => {
    expect(result).toBe(__dirname);
  };

  test('async', async () => {
    const result = await getDirectory(subject);
    checkResult(result);
  });

  test('sync', () => {
    const result = getDirectorySync(subject);
    checkResult(result);
  });
});

// https://github.com/davidtheclark/cosmiconfig/issues/63
describe('handles process.cwd()/stdin', () => {
  const subject = path.join(process.cwd(), 'stdin');
  const checkResult = (result: string) => {
    expect(result).toBe(process.cwd());
  };

  test('async', async () => {
    const result = await getDirectory(subject);
    checkResult(result);
  });

  test('sync', () => {
    const result = getDirectorySync(subject);
    checkResult(result);
  });
});

test('returns a promise if sync is not true', async () => {
  // Although we explicitly pass `false`, the result will be a promise even
  // if a value was not passed, because it would be falsy and not exactly
  // equal to `true`.
  const result = getDirectory(__dirname);
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  expect(result).toBeInstanceOf(Promise);

  await result;
});

test('propagates error thrown by is-directory in sync', () => {
  // @ts-ignore
  expect(() => getDirectorySync(null)).toThrow('Expected a string, got object');
});

test('rejects with the error thrown by is-directory in async', async () => {
  expect.hasAssertions();
  try {
    // @ts-ignore
    await getDirectory(null);
  } catch (err) {
    expect(err.message).toBe('Expected a string, got object');
  }
});
