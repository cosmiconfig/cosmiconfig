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
  if (content === '') return { filepath, config: undefined, isEmpty: true };
  const config = parse(content, filepath);
  if (config === null) return null;
  return { config, filepath };
}

function loadJsFile(filepath: string): Promise<CosmiconfigResult> {
  return readFile(filepath).then(content => {
    return fileContentToResult(content, filepath, parser.parseJs);
  });
}

function loadJsFileSync(filepath: string): CosmiconfigResult {
  return fileContentToResult(readFile.sync(filepath), filepath, parser.parseJs);
}

function loadJsonFile(filepath: string): Promise<CosmiconfigResult> {
  return readFile(filepath).then(content => {
    return fileContentToResult(content, filepath, parser.parseJson);
  });
}

function loadJsonFileSync(filepath: string): CosmiconfigResult {
  return fileContentToResult(
    readFile.sync(filepath),
    filepath,
    parser.parseJson
  );
}

function loadYamlFile(filepath: string): Promise<CosmiconfigResult> {
  return readFile(filepath).then(content => {
    return fileContentToResult(content, filepath, parser.parseYaml);
  });
}

function loadYamlFileSync(filepath: string): CosmiconfigResult {
  return fileContentToResult(
    readFile.sync(filepath),
    filepath,
    parser.parseYaml
  );
}

function loadPackageProp(
  directory: string,
  packageProp: string
): Promise<CosmiconfigResult> {
  const filepath = path.join(directory, 'package.json');
  return readFile(filepath).then(content => {
    return fileContentToResult(
      content,
      filepath,
      parser.parsePackageFile.bind(null, packageProp)
    );
  });
}

function loadPackagePropSync(
  directory: string,
  packageProp: string
): CosmiconfigResult {
  const filepath = path.join(directory, 'package.json');
  const content = readFile.sync(filepath);
  return fileContentToResult(
    content,
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

function loadRcFileWithExtensions(
  filepath: string,
  options: { strictJson: boolean, ignoreEmpty: boolean }
): Promise<CosmiconfigResult> {
  return loaderSeries(
    [
      () =>
        loadRcFileWithoutExtensions(filepath, {
          strictJson: options.strictJson,
        }),
      () => loadJsonFile(`${filepath}.json`),
      () => loadYamlFile(`${filepath}.yaml`),
      () => loadYamlFile(`${filepath}.yml`),
      () => loadJsFile(`${filepath}.js`),
    ],
    { ignoreEmpty: options.ignoreEmpty }
  );
}

function loadRcFileWithExtensionsSync(
  filepath: string,
  options: { strictJson: boolean, ignoreEmpty: boolean }
): CosmiconfigResult {
  return loaderSeries.sync(
    [
      () =>
        loadRcFileWithoutExtensionsSync(filepath, {
          strictJson: options.strictJson,
        }),
      () => loadJsonFileSync(`${filepath}.json`),
      () => loadYamlFileSync(`${filepath}.yaml`),
      () => loadYamlFileSync(`${filepath}.yml`),
      () => loadJsFileSync(`${filepath}.js`),
    ],
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
