'use strict';

var _ = require('lodash');
var path = require('path');
var Promise = require('pinkie-promise');
var resolveFrom = require('resolve-from');
var loadDefinedFile = require('./loadDefinedFile');

function mergeExtends(config, configDir) {
  if (!config.extends) {
    return Promise.resolve(config);
  }

  var extendLookups = [].concat(config.extends);
  var resultPromise = extendLookups.reduce(function(mergedConfigPromise, extendLookup) {
    return mergedConfigPromise.then(function(priorMergedConfig) {
      return loadExtendConfig(priorMergedConfig, configDir, extendLookup)
        .then(function(extendConfig) {
          return Promise.resolve(_.merge({}, priorMergedConfig, extendConfig));
        });
    });
  }, Promise.resolve(_.omit(config, 'extends')));

  return resultPromise;
}

function loadExtendConfig(config, configDir, extendLookup) {
  var extendPath = resolveFrom(configDir, extendLookup);
  var extendDir = path.dirname(extendPath);

  return loadDefinedFile(extendPath).then(function(result) {
    return mergeExtends(result.config, extendDir);
  });
}

module.exports = mergeExtends;
