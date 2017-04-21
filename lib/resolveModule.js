'use strict';
var assign = require('object-assign');
var paths = require('global-paths');
var path = require('path');
var resolveFilename = require('module')._resolveFilename;

function getModule(filename) {
  filename = path.resolve(process.cwd(), filename);
  var module = {
    id: filename,
    filename: filename,
    paths: paths(path.dirname(filename)),
  };
  return module;
}

function resolve(parent, id, prefix) {
  try {
    return resolveFilename(id, parent);
  } catch (err) {
    if (id.indexOf(prefix) < 0) {
      return resolveFilename(prefix + id, parent);
    } else {
      throw err;
    }
  }
}

module.exports = function (options, moduleOptions) {
  moduleOptions = assign({
    modulePrefix: options.modulePrefix,
    configPath: options.configPath,
  }, moduleOptions);

  var parent = getModule(moduleOptions.configPath);
  return resolve(parent, moduleOptions.moduleName, moduleOptions.modulePrefix);
};
