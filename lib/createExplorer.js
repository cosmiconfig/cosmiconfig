'use strict';

var Module = require('module');
var path = require('path');
var fs = require('graceful-fs');
var loadPackageProp = require('./loadPackageProp');
var loadRc = require('./loadRc');
var loadJs = require('./loadJs');
var loadDefinedFile = require('./loadDefinedFile');

function getStats(fnName) {
  return function (filepath) {
    return new Promise(function (resolve, reject) {
      fs.stat(filepath, function (err, stats) {
        if (err) return reject(err);
        return resolve(stats[fnName]());
      });
    });
  };
}

var isDirectory = getStats('isDirectory');
var isFile = getStats('isFile');

function mapArrStr(arr, callback) {
  return mapArr(arr, function (str) {
    if (typeof str === 'string') {
      str = callback(str);
    }
    return str;
  });
}

function mapArr(arr, callback) {
  if (Array.isArray(arr)){
    arr = Promise.all(arr.map(callback));
  } else  {
    if (arr) {
      arr = callback(arr);
    }
    arr = Promise.resolve(arr);
  }
  return arr;
}

function resolveFilename(moduleId, fromFile) {
  try {
    return Module._resolveFilename(moduleId, fromFile);
  } catch (err) {
    //
  }
}

function resolveFrom(moduleId, prefix, fromFile) {
  if (fromFile) {
    fromFile = {
      id: fromFile,
      filename: fromFile,
      paths: Module._nodeModulePaths(path.dirname(fromFile)),
    };
  } else {
    fromFile = process.mainModule;
  }

  var file = resolveFilename(moduleId, fromFile);

  if (!file && prefix && moduleId.indexOf(prefix) < 0) {
    file = resolveFilename(prefix + moduleId, fromFile);
  }
  return file || null;
}

function getModulePath(moduleId, prefix, fromFile) {
  var AbsPath = path.resolve(path.dirname(fromFile), moduleId);
  return isFile(AbsPath).catch(function (){
    return false;
  }).then(function (isFile) {
    if (isFile) {
      return AbsPath;
    } else {
      return resolveFrom(moduleId, prefix, fromFile) || resolveFrom(moduleId, prefix);
    }
  });
}

module.exports = function (options) {
  // These cache Promises that resolve with results, not the results themselves
  var fileCache = (options.cache) ? new Map() : null;
  var directoryCache = (options.cache) ? new Map() : null;

  function fixProps(config, filepath, props) {
    if (config && props) {
      return mapArr(props, function (prop){
        var prefix = options['prefix.' + prop];
        if (!prefix && options.moduleName) {
          prefix = prop.replace(/^(.+)s$/, options.moduleName + '-$1-');
        }
        return mapArrStr(config[prop], function (moduleId) {
          return getModulePath(moduleId, prefix, filepath).then(function (modulePath) {
            if (modulePath) {
              return loadConfig(modulePath).then(function (result){
                return result && result.config || moduleId;
              });
            }
            return moduleId;
          });
        }).then(function (values){
          if (config[prop]) {
            config[prop] = values;
          }
        });
      });
    }
    return Promise.resolve();
  }

  function transform(result) {
    return Promise.resolve(result && result.config).then(function (config) {
      if (config) {
        return fixProps(config, result.filepath, options.modules);
      }
    }).then(function () {
      if (options.transform) {
        result = options.transform(result);
      }
      return result;
    });
  }

  function clearFileCache() {
    if (fileCache) fileCache.clear();
  }

  function clearDirectoryCache() {
    if (directoryCache) directoryCache.clear();
  }

  function clearCaches() {
    clearFileCache();
    clearDirectoryCache();
  }

  function loadConfig(absoluteConfigPath) {
    if (fileCache && fileCache.has(absoluteConfigPath)) {
      return fileCache.get(absoluteConfigPath);
    }
    var result = loadDefinedFile(absoluteConfigPath, options)
      .then(transform);
    if (fileCache) fileCache.set(absoluteConfigPath, result);
    return result;
  }

  function load(searchPath, configPath) {
    if (configPath) {
      var absoluteConfigPath = resolveFrom(configPath) || path.resolve(process.cwd(), configPath);
      return loadConfig(absoluteConfigPath);
    }

    if (!searchPath) return Promise.resolve(null);

    var absoluteSearchPath = path.resolve(process.cwd(), searchPath);

    return isDirectory(absoluteSearchPath)
      .then(function (searchPathIsDirectory) {
        var directory = (searchPathIsDirectory)
          ? absoluteSearchPath
          : path.dirname(absoluteSearchPath);
        return searchDirectory(directory);
      });
  }

  function searchDirectory(directory) {
    if (directoryCache && directoryCache.has(directory)) {
      return directoryCache.get(directory);
    }

    var result = Promise.resolve()
      .then(function () {
        if (!options.packageProp) return;
        return loadPackageProp(directory, options);
      })
      .then(function (result) {
        if (result || !options.rc) return result;
        return loadRc(path.join(directory, options.rc), options);
      })
      .then(function (result) {
        if (result || !options.js) return result;
        return loadJs(path.join(directory, options.js));
      })
      .then(function (result) {
        if (result) return result;

        var splitPath = directory.split(path.sep);
        var nextDirectory = (splitPath.length > 1)
          ? splitPath.slice(0, -1).join(path.sep)
          : null;

        if (!nextDirectory || directory === options.stopDir) return null;

        return searchDirectory(nextDirectory);
      })
      .then(transform);

    if (directoryCache) directoryCache.set(directory, result);
    return result;
  }

  return {
    load: load,
    clearFileCache: clearFileCache,
    clearDirectoryCache: clearDirectoryCache,
    clearCaches: clearCaches,
  };
};
