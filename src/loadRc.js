// @flow
'use strict';

const yaml = require('js-yaml');
const requireJs = require('./requireJs');
const readFile = require('./readFile');
const parseJson = require('./parseJson');
const funcRunner = require('./funcRunner');
const createParseFile = require('./createParseFile');

module.exports = function loadRc(
  filepath: string,
  options: {
    ignoreEmpty: boolean,
    sync?: boolean,
    rcStrictJson?: boolean,
    rcExtensions?: boolean,
  }
): Promise<?cosmiconfig$Result> | ?cosmiconfig$Result {
  const parseYaml = (content, filename) => yaml.safeLoad(content, { filename });
  const parse = options.rcStrictJson ? parseJson : parseYaml;
  const parseExtensionlessRcFile = createParseFile(
    filepath,
    parse,
    options.ignoreEmpty
  );

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

  function loadRcWithExtensions() {
    function loadExtension(
      extension: string,
      parse: (content: string, filename: string) => Object
    ) {
      const fpath = `${filepath}.${extension}`;
      const parseRcFile = createParseFile(fpath, parse, options.ignoreEmpty);

      // Check the result from the previous `loadExtension` invocation. If result
      // isn't null, just return that.
      return result => {
        if (result != null) return result;

        // Try to load the rc file for the given extension.
        return funcRunner(readRcFile(fpath), [parseRcFile]);
      };
    }

    const parseYml = (content: string, filename: string) =>
      yaml.safeLoad(content, { filename });

    return funcRunner(!options.sync ? Promise.resolve() : undefined, [
      loadExtension('json', parseJson),
      loadExtension('yaml', parseYml),
      loadExtension('yml', parseYml),
      loadExtension('js', requireJs),
    ]);
  }

  function readRcFile(filepath: string): Promise<?string> | ?string {
    return !options.sync ? readFile(filepath) : readFile.sync(filepath);
  }
};
