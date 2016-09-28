'use strict';

const yaml = require('js-yaml');
const parseJson = require('parse-json');
const requireFromString = require('require-from-string');
const readFile = require('./readFile');

module.exports = function (filepath, options) {
  return loadExtensionlessRc().then((result) => {
    if (result) return result;
    if (options.rcExtensions) return loadRcWithExtensions();
    return null;
  });

  function loadExtensionlessRc() {
    return readRcFile().then((content) => {
      if (!content) return null;

      const pasedConfig = (options.rcStrictJson)
        ? parseJson(content, filepath)
        : yaml.safeLoad(content, {
          filename: filepath,
        });
      return {
        config: pasedConfig,
        filepath: filepath,
      };
    });
  }

  function loadRcWithExtensions() {
    return readRcFile('json').then((content) => {
      if (content) {
        const successFilepath = `${filepath}.json`;
        return {
          config: parseJson(content, successFilepath),
          filepath: successFilepath,
        };
      }
      // If not content was found in the file with extension,
      // try the next possible extension
      return readRcFile('yaml');
    }).then((content) => {
      if (content) {
        // If the previous check returned an object with a config
        // property, then it succeeded and this step can be skipped
        if (content.config) return content;
        // If it just returned a string, then *this* check succeeded
        const successFilepath = `${filepath}.yaml`;
        return {
          config: yaml.safeLoad(content, { filename: successFilepath }),
          filepath: successFilepath,
        };
      }
      return readRcFile('yml');
    }).then((content) => {
      if (content) {
        if (content.config) return content;
        const successFilepath = `${filepath}.yml`;
        return {
          config: yaml.safeLoad(content, { filename: successFilepath }),
          filepath: successFilepath,
        };
      }
      return readRcFile('js');
    }).then((content) => {
      if (content) {
        if (content.config) return content;
        const successFilepath = `${filepath}.js`;
        return {
          config: requireFromString(content, successFilepath),
          filepath: successFilepath,
        };
      }
      return null;
    });
  }

  function readRcFile(extension) {
    const filepathWithExtension = (extension) ? `${filepath}.${extension}` : filepath;
    return readFile(filepathWithExtension);
  }
};
