import fs, { promises as fsp } from 'fs';

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

// UTF-16LE and UTF-16BE byte-order marks. A config file saved with one of
// these encodings (e.g. via PowerShell's default `Out-File` redirection on
// Windows) is not valid UTF-8, so it must be decoded accordingly instead of
// being passed through the UTF-8 path, which would otherwise produce garbage.
/** @internal */
export function decodeFileContent(buffer: Buffer): string {
  if (buffer[0] === 0xff && buffer[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(buffer);
  }
  if (buffer[0] === 0xfe && buffer[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(buffer);
  }
  return buffer.toString('utf-8');
}

/** @internal */
export function removeUndefinedValuesFromObject(
  options: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined),
  );
}

/** @internal */
/* istanbul ignore next -- @preserve */
export async function isDirectory(path: string): Promise<boolean> {
  try {
    const stat = await fsp.stat(path);
    return stat.isDirectory();
  } catch (e) {
    if (e.code === 'ENOENT') {
      return false;
    }

    throw e;
  }
}

/** @internal */
/* istanbul ignore next -- @preserve */
export function isDirectorySync(path: string): boolean {
  try {
    const stat = fs.statSync(path);
    return stat.isDirectory();
  } catch (e) {
    if (e.code === 'ENOENT') {
      return false;
    }
    throw e;
  }
}
