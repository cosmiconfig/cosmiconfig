// @flow
'use strict';

const path = require('path');
const readFile = require('./readFile');
const cacheWrapper = require('./cacheWrapper');

// searchDirectory and searchDirectorySync basically use the
// findDirectory functions but also continue looking
// up the directory tree if nothing is found, and
// optionally cache the results.
function searchDirectory(
  searchSchema: Array<SearchSchemaItem>,
  dir: string,
  options: {
    ignoreEmpty: boolean,
    stopDir: string,
    cache: ?Map<string, Promise<CosmiconfigResult>>,
  }
): Promise<CosmiconfigResult> {
  const run = () => {
    return findInDirectory(dir, searchSchema, options).then(result => {
      const nextDir = nextDirectoryToSearch(dir, result, options);
      if (!nextDir) {
        return result;
      }
      return searchDirectory(searchSchema, nextDir, options);
    });
  };
  if (options.cache) {
    return cacheWrapper(options.cache, dir, run);
  }
  return run();
}

searchDirectory.sync = function searchDirectorySync(
  searchSchema: Array<SearchSchemaItem>,
  dir: string,
  options: {
    ignoreEmpty: boolean,
    stopDir: string,
    cache: ?Map<string, CosmiconfigResult>,
  }
): CosmiconfigResult {
  const run = () => {
    const result = findInDirectorySync(dir, searchSchema, options);
    const nextDir = nextDirectoryToSearch(dir, result, options);
    if (!nextDir) {
      return result;
    }
    return searchDirectorySync(searchSchema, nextDir, options);
  };
  if (options.cache) {
    return cacheWrapper(options.cache, dir, run);
  }
  return run();
};

function createCosmiconfigResult(
  content: string | null,
  filepath: string,
  schemaItem: SearchSchemaItem
): CosmiconfigResult {
  if (content === null) {
    return null;
  }
  if (content.trim() === '') {
    return { filepath, config: undefined, isEmpty: true };
  }

  const config = schemaItem.loader(content, filepath);
  if (config === null) {
    return null;
  }

  if (!schemaItem.property) {
    return { config, filepath };
  }

  const configProperty = config[schemaItem.property];
  if (!configProperty) {
    return null;
  }

  return { config: configProperty, filepath };
}

function loadSchemaItemInDirectory(
  dir: string,
  schemaItem: SearchSchemaItem
): Promise<CosmiconfigResult> {
  const filepath = path.join(dir, schemaItem.filename);
  return readFile(filepath).then(content => {
    return createCosmiconfigResult(content, filepath, schemaItem);
  });
}

function loadSchemaItemInDirectorySync(
  dir: string,
  schemaItem: SearchSchemaItem
): CosmiconfigResult {
  const filepath = path.join(dir, schemaItem.filename);
  const content = readFile.sync(filepath);
  return createCosmiconfigResult(content, filepath, schemaItem);
}

// Returns a boolean indicating whether the search should stop
// on the current CosmiconfigResult.
function shouldStopWithResult(
  result: CosmiconfigResult,
  options: {
    ignoreEmpty: boolean
  }
): boolean {
  if (result === null) return false;
  if (result.isEmpty && options.ignoreEmpty) return false;
  return true;
}

function findInDirectory(
  dir: string,
  searchSchema: Array<SearchSchemaItem>,
  options: { ignoreEmpty: boolean }
): Promise<CosmiconfigResult> {
  return searchSchema.reduce((prevResultPromise, schemaItem) => {
    return prevResultPromise.then(prevResult => {
      if (!shouldStopWithResult(prevResult, options)) {
        return loadSchemaItemInDirectory(dir, schemaItem);
      }
      return prevResult;
    });
  }, Promise.resolve(null));
}

function findInDirectorySync(
  dir: string,
  searchSchema: Array<SearchSchemaItem>,
  options: { ignoreEmpty: boolean }
): CosmiconfigResult {
  let result = null;
  for (const schemaItem of searchSchema) {
    result = loadSchemaItemInDirectorySync(dir, schemaItem);
    if (shouldStopWithResult(result, options)) break;
  }
  return result;
}

function nextDirUp(dir: string): string {
  return path.dirname(dir);
}

// Get the next directory that should be searched, or
// null if the search should stop at the current directory.
function nextDirectoryToSearch(
  currentDir: string,
  currentResult: CosmiconfigResult,
  options: { ignoreEmpty: boolean, stopDir: string }
): ?string {
  if (shouldStopWithResult(currentResult, options)) {
    return null;
  }
  const nextDir = nextDirUp(currentDir);
  if (nextDir === currentDir || currentDir === options.stopDir) {
    return null;
  }
  return nextDir;
}

module.exports = searchDirectory;
