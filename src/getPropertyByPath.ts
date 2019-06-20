// Resolves property names or property paths defined with period-delimited
// strings or arrays of strings. Property names that are found on the source
// object are used directly (even if they include a period).
// Nested property names that include periods, within a path, are only
// understood in array paths.
function getPropertyByPath(
  source: { [key: string]: unknown },
  path: string | string[],
): unknown {
  if (typeof path === 'string' && source.hasOwnProperty(path)) {
    return source[path];
  }

  const parsedPath = typeof path === 'string' ? path.split('.') : path;

  // TODO: refactor in a more type friendly way
  return parsedPath.reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (previous: any, key: string): unknown => {
      if (previous === undefined) {
        return previous;
      }

      return previous[key];
    },
    source,
  );
}

export { getPropertyByPath };
