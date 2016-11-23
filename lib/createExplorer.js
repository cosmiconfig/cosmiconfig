'use strict';

var Module = require('module');
var path = require('path');
var fs = require('graceful-fs');
var deepAssign = require('deep-assign');
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

function resolveFrom(moduleId, fromDir, fromFile) {
  if (fromDir) {
    fromFile = path.join(fromDir, 'noop.js');
    fromFile = {
      id: fromFile,
      filename: fromFile,
      paths: Module._nodeModulePaths(fromDir),
    };
  } else if (fromFile) {
    fromFile = {
      id: fromFile,
      filename: fromFile,
      paths: Module._nodeModulePaths(path.dirname(fromFile)),
    };
  } else {
    fromFile = module;
  }
  try {
    return Module._resolveFilename(moduleId, fromFile);
  } catch (err) {
    return null;
  }
}

function getModulePath(moduleId, fromFile) {
  var AbsPath = path.resolve(path.dirname(fromFile), moduleId);
  return isFile(AbsPath).catch(function (){
    return false;
  }).then(function (isFile) {
    if (isFile) {
      return AbsPath;
    } else {
      return resolveFrom(moduleId, null, fromFile) || resolveFrom(moduleId, process.cwd()) || resolveFrom(moduleId);
    }
  });
}

function fixProps(config, filepath, props, callback) {
  if (config && props) {
    return mapArr(props, function (prop){
      return mapArrStr(config[prop], function (moduleId) {
        return getModulePath(moduleId, filepath).then(function (modulePath) {
          return Promise.resolve(modulePath && callback(modulePath)).then(function (module) {
            return module || moduleId;
          });
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

function convertProp2Array(obj, props) {
  [props].forEach(function (key){
    if (obj[key] && !Array.isArray(obj[key])) {
      obj[key] = [obj[key]];
    }
  });
}

function arrayAssign(to, from, props) {
  if (props) {
    props.forEach(function (prop) {
      if (from[prop]) {
        if (to[prop]) {
          to[prop] = to[prop].concat(from[prop]);
        } else {
          to[prop] = from[prop];
        }
      }
    });
  }
}

module.exports = function (options) {
  // These cache Promises that resolve with results, not the results themselves
  var fileCache = (options.cache) ? new Map() : null;
  var directoryCache = (options.cache) ? new Map() : null;

  convertProp2Array(options, ['extend', 'pathResolve']);
  function transform(result) {
    return Promise.resolve(result && result.config).then(function (config) {
      if (!config) {
        return;
      }
      convertProp2Array(config, options.pathResolve);
      convertProp2Array(config, options.extend);
      return fixProps(config, result.filepath, options.extend, loadConfig).then(function () {
        return mapArr(options.extend, function (extendProp) {
          if (!config[extendProp]) {
            return;
          }
          var extendConfigs = [];
          var extendPckNames = [];
          config[extendProp].forEach(function (extendResult) {
            var extendConfig = extendResult && extendResult.config;
            if (extendConfig) {
              extendConfigs.push(extendConfig);
            } else {
              extendPckNames.push(extendResult);
            }
          });
          if (extendConfigs.length) {
            if (options.pathResolve) {
              options.pathResolve.forEach(function (prop) {
                var values = config[prop] || [];
                extendConfigs.forEach(function (extendConfig){
                  if (extendConfig[prop]) {
                    values.concat(extendConfig[prop]);
                  }
                });
                if (values.length) {
                  config[prop] = values;
                }
              });
            }

            extendConfigs.push(config);
            config = deepAssign.apply(null, extendConfigs);
            delete config[extendProp];
          }

          if (extendPckNames.length) {
            config[extendProp] = extendPckNames;
          } else {
            delete config[extendPckNames];
          }
          result.config = config;
        });
      }).then(function () {
        return fixProps(config, result.filepath, options.pathResolve, require);
      });
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
