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

/** @internal */
export function removeUndefinedValuesFromObject(
  options: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  /* istanbul ignore if -- @preserve */
  if (!options) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined),
  );
}
