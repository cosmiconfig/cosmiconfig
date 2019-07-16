// Resolves property names or property paths defined with period-delimited
// strings or arrays of strings. Property names that are found on the source
// object are used directly (even if they include a period).
// Nested property names that include periods, within a path, are only
// understood in array paths.
function getPropertyByPath(
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

export { getPropertyByPath };
