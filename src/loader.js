// @flow
'use strict';

const path = require('path');
const parser = require('./parser');
const readFile = require('./readFile');
const loaderSeries = require('./loaderSeries');

function fileContentToResult(
  content: string | null,
  filepath: string,
  parse: (string, string) => Object | null
): CosmiconfigResult {
  if (content === null) return null;

  // Remove all whitespace to ensure empty file is equal to an empty string
  const contentWithoutWhitespace = content.trim();
  if (contentWithoutWhitespace === '') {
    return {
      filepath,
      config: undefined,
      isEmpty: true,
    };
  }
  const config = parse(content, filepath);
  if (config === null) return null;
  return { config, filepath };
}

function getResultFromFile(
  filepath: string,
  parse: (string, string) => Object | null
): Promise<CosmiconfigResult> {
  return readFile(filepath).then(content => {
    return fileContentToResult(content, filepath, parse);
  });
}

function getResultFromFileSync(
  filepath: string,
  parse: (string, string) => Object | null
): CosmiconfigResult {
  return fileContentToResult(readFile.sync(filepath), filepath, parse);
}

function loadJsFile(filepath: string): Promise<CosmiconfigResult> {
  return getResultFromFile(filepath, parser.parseJs);
}

function loadJsFileSync(filepath: string): CosmiconfigResult {
  return getResultFromFileSync(filepath, parser.parseJs);
}

function loadJsonFile(filepath: string): Promise<CosmiconfigResult> {
  return getResultFromFile(filepath, parser.parseJson);
}

function loadJsonFileSync(filepath: string): CosmiconfigResult {
  return getResultFromFileSync(filepath, parser.parseJson);
}

function loadYamlFile(filepath: string): Promise<CosmiconfigResult> {
  return getResultFromFile(filepath, parser.parseYaml);
}

function loadYamlFileSync(filepath: string): CosmiconfigResult {
  return getResultFromFileSync(filepath, parser.parseYaml);
}

function loadPackageProp(
  directory: string,
  packageProp: string
): Promise<CosmiconfigResult> {
  const filepath = path.join(directory, 'package.json');
  return getResultFromFile(
    filepath,
    parser.parsePackageFile.bind(null, packageProp)
  );
}

function loadPackagePropSync(
  directory: string,
  packageProp: string
): CosmiconfigResult {
  const filepath = path.join(directory, 'package.json');
  return getResultFromFileSync(
    filepath,
    parser.parsePackageFile.bind(null, packageProp)
  );
}

function loadRcFileWithoutExtensions(
  filepath: string,
  options: { strictJson: boolean }
): Promise<CosmiconfigResult> {
  if (options.strictJson) {
    return loadJsonFile(filepath);
  }
  return loadYamlFile(filepath);
}

function loadRcFileWithoutExtensionsSync(
  filepath: string,
  options: { strictJson: boolean }
): CosmiconfigResult {
  if (options.strictJson) {
    return loadJsonFileSync(filepath);
  }
  return loadYamlFileSync(filepath);
}

function getRcLoaderSeries(
  sync: boolean,
  filepath: string,
  strictJson: boolean
): Array<Function> {
  const withoutExtensions = sync
    ? loadRcFileWithoutExtensionsSync
    : loadRcFileWithoutExtensions;
  const json = sync ? loadJsonFileSync : loadJsonFile;
  const yaml = sync ? loadYamlFileSync : loadYamlFile;
  const js = sync ? loadJsFileSync : loadJsFile;

  return [
    () => withoutExtensions(filepath, { strictJson }),
    () => json(`${filepath}.json`),
    () => yaml(`${filepath}.yaml`),
    () => yaml(`${filepath}.yml`),
    () => js(`${filepath}.js`),
  ];
}

function loadRcFileWithExtensions(
  filepath: string,
  options: { strictJson: boolean, ignoreEmpty: boolean }
): Promise<CosmiconfigResult> {
  return loaderSeries(getRcLoaderSeries(false, filepath, options.strictJson), {
    ignoreEmpty: options.ignoreEmpty,
  });
}

function loadRcFileWithExtensionsSync(
  filepath: string,
  options: { strictJson: boolean, ignoreEmpty: boolean }
): CosmiconfigResult {
  return loaderSeries.sync(
    getRcLoaderSeries(true, filepath, options.strictJson),
    { ignoreEmpty: options.ignoreEmpty }
  );
}

function loadRcFile(
  filepath: string,
  options: { strictJson: boolean, ignoreEmpty: boolean, extensions: boolean }
): Promise<CosmiconfigResult> {
  if (options.extensions) {
    return loadRcFileWithExtensions(filepath, options);
  }
  return loadRcFileWithoutExtensions(filepath, options);
}

function loadRcFileSync(
  filepath: string,
  options: { strictJson: boolean, ignoreEmpty: boolean, extensions: boolean }
): CosmiconfigResult {
  if (options.extensions) {
    return loadRcFileWithExtensionsSync(filepath, options);
  }
  return loadRcFileWithoutExtensionsSync(filepath, options);
}

module.exports = {
  loadJsFile,
  loadJsFileSync,
  loadJsonFile,
  loadJsonFileSync,
  loadYamlFile,
  loadYamlFileSync,
  loadPackageProp,
  loadPackagePropSync,
  loadRcFile,
  loadRcFileSync,
};
