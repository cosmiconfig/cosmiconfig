'use strict';

const fs = require('graceful-fs');
const yaml = require('js-yaml');
const parseJson = require('parse-json');
const requireFromString = require('require-from-string');

module.exports = function (fileCache, filepath, options) {
  const cached = fileCache.get(filepath);
  if (cached) return cached;

  function cacheResult(result) {
    fileCache.set(filepath, result);
    return result;
  }

  return loadExtensionlessRc().then((result) => {
    if (result) return result;
    if (options.extensions) return loadRcWithExtensions();
    return null;
  });

  function loadExtensionlessRc() {
    return readRcFile().then((content) => {
      if (!content) return null;

      const pasedConfig = (options.strictJson)
        ? parseJson(content, filepath)
        : yaml.safeLoad(content, {
          filename: filepath,
        });
      return cacheResult({
        config: pasedConfig,
        filepath: filepath,
      });
    });
  }

  function loadRcWithExtensions() {
    return readRcFile('json').then((content) => {
      if (content) {
        const successFilepath = `${filepath}.json`;
        return cacheResult({
          config: parseJson(content, successFilepath),
          filepath: successFilepath,
        });
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
        return cacheResult({
          config: yaml.safeLoad(content, { filename: successFilepath }),
          filepath: successFilepath,
        });
      }
      return readRcFile('yml');
    }).then((content) => {
      if (content) {
        if (content.config) return content;
        const successFilepath = `${filepath}.yml`;
        return cacheResult({
          config: yaml.safeLoad(content, { filename: successFilepath }),
          filepath: successFilepath,
        });
      }
      return readRcFile('js');
    }).then((content) => {
      if (content) {
        if (content.config) return content;
        const successFilepath = `${filepath}.js`;
        return cacheResult({
          config: requireFromString(content, successFilepath),
          filepath: successFilepath,
        });
      }
      return cacheResult(null);
    });
  }

  function readRcFile(extension) {
    return new Promise((resolve, reject) => {
      const filepathWithExtension = (extension) ? `${filepath}.${extension}` : filepath;
      fs.readFile(filepathWithExtension, 'utf8', (fileError, content) => {
        if (fileError) {
          if (fileError.code === 'ENOENT') return resolve(null);
          return reject(fileError);
        }
        resolve(content);
      });
    });
  }
};
