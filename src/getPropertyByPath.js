// @flow
'use strict';

// Resolves property paths defined with period-delimited strings or arrays of strings.
// Property names that include periods are only understand in array paths.
function getPropertyByPath(source: Object, path: string | Array<string>): any {
  const parsedPath = typeof path === 'string' ? path.split('.') : path;
  return parsedPath.reduce((previous, key) => {
    if (previous === undefined) {
      return previous;
    }
    return previous[key];
  }, source);
}

module.exports = getPropertyByPath;
