'use strict';

var yaml = require('js-yaml');
var requireFromString = require('require-from-string');
var readFile = require('./readFile');
var parseJson = require('./parseJson');
var funcRunner = require('./funcRunner');

module.exports = function(filepath, options) {
  function afterLoadExtensionlessRc(result) {
    if (result) return result;
    if (options.rcExtensions) return loadRcWithExtensions();
    return null;
  }

  return !options.sync
    ? loadExtensionlessRc().then(afterLoadExtensionlessRc)
    : afterLoadExtensionlessRc(loadExtensionlessRc());

  function loadExtensionlessRc() {
    function parseExtensionlessRcFile(content) {
      if (!content) return null;

      var pasedConfig = options.rcStrictJson
        ? parseJson(content, filepath)
        : yaml.safeLoad(content, {
            filename: filepath,
          });
      return {
        config: pasedConfig,
        filepath: filepath,
      };
    }

    return !options.sync
      ? readRcFile().then(parseExtensionlessRcFile)
      : parseExtensionlessRcFile(readRcFile());
  }

  function loadRcWithExtensions() {
    function parseJsonRcFile(content) {
      if (content) {
        var successFilepath = filepath + '.json';
        return {
          config: parseJson(content, successFilepath),
          filepath: successFilepath,
        };
      }
      // If not content was found in the file with extension,
      // try the next possible extension
      return readRcFile('yaml');
    }

    function parseYmlRcFile(content) {
      if (content) {
        // If the previous check returned an object with a config
        // property, then it succeeded and this step can be skipped
        if (content.config) return content;
        // If it just returned a string, then *this* check succeeded
        var successFilepath = filepath + '.yaml';
        return {
          config: yaml.safeLoad(content, { filename: successFilepath }),
          filepath: successFilepath,
        };
      }
      return readRcFile('yml');
    }

    function parseYamlRcFile(content) {
      if (content) {
        if (content.config) return content;
        var successFilepath = filepath + '.yml';
        return {
          config: yaml.safeLoad(content, { filename: successFilepath }),
          filepath: successFilepath,
        };
      }
      return readRcFile('js');
    }

    function parseJsRcFile(content) {
      if (content) {
        if (content.config) return content;
        var successFilepath = filepath + '.js';
        return {
          config: requireFromString(content, successFilepath),
          filepath: successFilepath,
        };
      }
      return null;
    }

    return funcRunner(readRcFile('json'), [
      parseJsonRcFile,
      parseYmlRcFile,
      parseYamlRcFile,
      parseJsRcFile,
    ]);
  }

  function readRcFile(extension) {
    var filepathWithExtension = extension
      ? filepath + '.' + extension
      : filepath;
    return !options.sync
      ? readFile(filepathWithExtension)
      : readFile.sync(filepathWithExtension);
  }
};
