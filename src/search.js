// @flow
'use strict';

const path = require('path');
const readFile = require('./readFile');
const cacheWrapper = require('./cacheWrapper');

type Loader = (string, string) => Object | null;

type SearchSchemaItem = {
  filename: string,
  loader: Loader,
  property: string | null,
};

function loadContent(
  content: string | null,
  filepath: string,
  schemaItem: SearchSchemaItem
): CosmiconfigResult {
  if (content === null) {
    return null;
  }
  if (content === '') {
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

function loadSchemaItem(
  dir: string,
  schemaItem: SearchSchemaItem
): Promise<CosmiconfigResult> {
  const filepath = path.join(dir, schemaItem.filename);
  return readFile(filepath).then(content => {
    return loadContent(content, filepath, schemaItem);
  });
}

function loadSchemaItemSync(
  dir: string,
  schemaItem: SearchSchemaItem
): CosmiconfigResult {
  const filepath = path.join(dir, schemaItem.filename);
  const content = readFile.sync(filepath);
  return loadContent(content, filepath, schemaItem);
}

function shouldTryNext(result: CosmiconfigResult, ignoreEmpty: boolean) {
  return result === null || (result.isEmpty && ignoreEmpty);
}

function searchDir(
  dir: string,
  searchSchema: Array<SearchSchemaItem>,
  options: { ignoreEmpty: boolean }
): Promise<CosmiconfigResult> {
  return searchSchema.reduce((prevResultPromise, schemaItem) => {
    return prevResultPromise.then(prevResult => {
      if (shouldTryNext(prevResult, options.ignoreEmpty)) {
        return loadSchemaItem(dir, schemaItem);
      }
      return prevResult;
    });
  }, Promise.resolve(null));
}

function searchDirSync(
  dir: string,
  searchSchema: Array<SearchSchemaItem>,
  options: { ignoreEmpty: boolean }
): CosmiconfigResult {
  let result = null;
  for (const schemaItem of searchSchema) {
    result = loadSchemaItemSync(dir, schemaItem);
    if (!shouldTryNext(result, options.ignoreEmpty)) break;
  }
  return result;
}

function nextDirUp(dir: string): string {
  return path.dirname(dir);
}

function shouldSearchUp(
  dir: string,
  result: CosmiconfigResult,
  options: { ignoreEmpty: boolean, stopDir: string }
): boolean {
  if (!shouldTryNext(result, options.ignoreEmpty)) {
    return false;
  }
  const nextDir = nextDirUp(dir);
  if (nextDir === dir || dir === options.stopDir) {
    return false;
  }
  return true;
}

function search(
  searchSchema: Array<SearchSchemaItem>,
  dir: string,
  options: {
    ignoreEmpty: boolean,
    stopDir: string,
    cache: ?Map<string, Promise<CosmiconfigResult>>,
  }
): Promise<CosmiconfigResult> {
  const run = () => {
    return searchDir(dir, searchSchema, options).then(result => {
      if (!shouldSearchUp(dir, result, options)) {
        return result;
      }
      return search(searchSchema, nextDirUp(dir), options);
    });
  };
  if (options.cache) {
    return cacheWrapper(options.cache, dir, run);
  }
  return run();
}

search.sync = function searchSync(
  searchSchema: Array<SearchSchemaItem>,
  dir: string,
  options: {
    ignoreEmpty: boolean,
    stopDir: string,
    cache: ?Map<string, CosmiconfigResult>,
  }
): CosmiconfigResult {
  const run = () => {
    const result = searchDirSync(dir, searchSchema, options);
    if (!shouldSearchUp(dir, result, options)) {
      return result;
    }
    return searchSync(searchSchema, nextDirUp(dir), options);
  };
  if (options.cache) {
    return cacheWrapper(options.cache, dir, run);
  }
  return run();
};

module.exports = search;
