// @flow
'use strict';

const yaml = require('js-yaml');
const requireFromString = require('require-from-string');
const readFile = require('./readFile');
const parseJson = require('./parseJson');
const funcRunner = require('./funcRunner');

module.exports = function loadRc(
  filepath: string,
  options: {
    sync?: boolean,
    rcStrictJson?: boolean,
    rcExtensions?: boolean,
  }
): Promise<?cosmiconfig$Result> | ?cosmiconfig$Result {
  if (!options.sync) {
    return readFile(filepath)
      .then(parseExtensionlessRcFile)
      .then(checkExtensionlessRcResult);
  } else {
    return checkExtensionlessRcResult(
      parseExtensionlessRcFile(readFile.sync(filepath))
    );
  }

  function checkExtensionlessRcResult(result) {
    if (result) return result;
    if (options.rcExtensions) return loadRcWithExtensions();
    return null;
  }

  function parseExtensionlessRcFile(content: ?string): ?cosmiconfig$Result {
    if (!content) return null;
    const pasedConfig = options.rcStrictJson
      ? parseJson(content, filepath)
      : yaml.safeLoad(content, { filename: filepath });
    return {
      config: pasedConfig,
      filepath,
    };
  }

  function loadRcWithExtensions() {
    let foundConfig = null;
    return funcRunner(readRcFile('json'), [
      (jsonContent: ?string) => {
        if (foundConfig) {
          return;
        } else if (jsonContent) {
          const successFilepath = `${filepath}.json`;
          foundConfig = {
            config: parseJson(jsonContent, successFilepath),
            filepath: successFilepath,
          };
        } else {
          return readRcFile('yaml');
        }
      },
      (yamlContent: ?string) => {
        if (foundConfig) {
          return;
        } else if (yamlContent) {
          const successFilepath = `${filepath}.yaml`;
          foundConfig = {
            config: yaml.safeLoad(yamlContent, { filename: successFilepath }),
            filepath: successFilepath,
          };
        } else {
          return readRcFile('yml');
        }
      },
      (ymlContent: ?string) => {
        if (foundConfig) {
          return;
        } else if (ymlContent) {
          const successFilepath = `${filepath}.yml`;
          foundConfig = {
            config: yaml.safeLoad(ymlContent, { filename: successFilepath }),
            filepath: successFilepath,
          };
        } else {
          return readRcFile('js');
        }
      },
      (jsContent: ?string) => {
        if (foundConfig) {
          return;
        } else if (jsContent) {
          const successFilepath = `${filepath}.js`;
          foundConfig = {
            config: requireFromString(jsContent, successFilepath),
            filepath: successFilepath,
          };
        } else {
          return;
        }
      },
      () => foundConfig,
    ]);
  }

  function readRcFile(extension: ?string): Promise<?string> | ?string {
    const filepathWithExtension = extension
      ? `${filepath}.${extension}`
      : filepath;
    return !options.sync
      ? readFile(filepathWithExtension)
      : readFile.sync(filepathWithExtension);
  }
};
