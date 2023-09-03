import fs from 'node:fs';
import fsPromises from 'node:fs/promises';

/**
 * @internal
 */
export function emplace<K, V>(map: Map<K, V>, key: K, fn: () => V): V {
  const cached = map.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const result = fn();
  map.set(key, result);
  return result;
}

// Resolves property names or property paths defined with period-delimited
// strings or arrays of strings. Property names that are found on the source
// object are used directly (even if they include a period).
// Nested property names that include periods, within a path, are only
// understood in array paths.
/**
 * @internal
 */
export function getPropertyByPath(
  source: { [key: string]: unknown },
  path: string | Array<string>,
): unknown {
  if (
    typeof path === 'string' &&
    Object.prototype.hasOwnProperty.call(source, path)
  ) {
    return source[path];
  }

  const parsedPath = typeof path === 'string' ? path.split('.') : path;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return parsedPath.reduce((previous: any, key): unknown => {
    if (previous === undefined) {
      return previous;
    }
    return previous[key];
  }, source);
}

/**
 * @internal
 */
/* istanbul ignore next -- @preserve */
export async function isDirectory(filepath: string): Promise<boolean> {
  try {
    return (await fsPromises.stat(filepath)).isDirectory();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

/**
 * @internal
 */
/* istanbul ignore next -- @preserve */
export function isDirectorySync(filepath: string): boolean {
  try {
    return fs.statSync(filepath).isDirectory();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}
