'use strict';

const yaml = require('js-yaml');
const requireFromString = require('require-from-string');
const readFile = require('./readFile');
const parseJson = require('./parseJson');
const funcRunner = require('./funcRunner');

module.exports = function loadRc(filepath, options) {
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

      const pasedConfig = options.rcStrictJson
        ? parseJson(content, filepath)
        : yaml.safeLoad(content, {
            filename: filepath,
          });
      return {
        config: pasedConfig,
        filepath,
      };
    }

    return !options.sync
      ? readRcFile().then(parseExtensionlessRcFile)
      : parseExtensionlessRcFile(readRcFile());
  }

  function loadRcWithExtensions() {
    function makeRcFileParser(parse, extn, nextExtn) {
      return function parseRcFile(content) {
        if (content) {
          // If the previous check returned an object with a config
          // property, then it succeeded and this step can be skipped
          if (content.config) return content;
          // If it just returned a string, then *this* check succeeded
          const successFilepath = `${filepath}.${extn}`;
          return {
            config: parse(content, successFilepath),
            filepath: successFilepath,
          };
        }
        // If not content was found in the file with extension,
        // try the next possible extension
        return nextExtn ? readRcFile(nextExtn) : null;
      };
    }

    const parseJsonRcFile = makeRcFileParser(parseJson, 'json', 'yaml');
    const parseYaml = (content, filepath) =>
      yaml.safeLoad(content, { filename: filepath });
    const parseYamlRcFile = makeRcFileParser(parseYaml, 'yaml', 'yml');
    const parseYmlRcFile = makeRcFileParser(parseYaml, 'yml', 'js');
    const parseJsRcFile = makeRcFileParser(requireFromString, 'js');

    return funcRunner(readRcFile('json'), [
      parseJsonRcFile,
      parseYamlRcFile,
      parseYmlRcFile,
      parseJsRcFile,
    ]);
  }

  function readRcFile(extension) {
    const filepathWithExtension = extension
      ? `${filepath}.${extension}`
      : filepath;
    return !options.sync
      ? readFile(filepathWithExtension)
      : readFile.sync(filepathWithExtension);
  }
};
