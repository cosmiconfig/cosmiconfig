// @flow
'use strict';

module.exports = function createParseFile(
  filepath: string,
  parse: (string, string) => Object,
  ignoreEmpty: boolean
): string => ?CosmiconfigResult {
  return function parseFile(content: string): ?CosmiconfigResult {
    const isEmpty = content === '';
    if (content == null || (isEmpty && ignoreEmpty)) return null;

    return isEmpty
      ? { config: undefined, filepath, isEmpty }
      : { config: parse(content, filepath), filepath };
  };
};
