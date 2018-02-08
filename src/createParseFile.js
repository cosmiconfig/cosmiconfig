'use strict';

module.exports = function createParseFile(filepath, parse, ignoreEmpty) {
  return function parseFile(content) {
    const isEmpty = content === '';
    if (content == null || (isEmpty && ignoreEmpty)) return null;

    return isEmpty
      ? { config: undefined, filepath, isEmpty }
      : { config: parse(content, filepath), filepath };
  };
};
