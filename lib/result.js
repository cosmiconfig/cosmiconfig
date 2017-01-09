'use strict';
var resolveModule = require('./resolveModule');
var assign = require('object-assign');
var optionSet = new WeakMap();

function Result(resultProps, options) {
  if (!this) {
    return new Result(resultProps, options);
  }
  assign(this, resultProps);
  optionSet.set(this, options);
}

Result.prototype.resolveModule = function (moduleOptions) {
  var options = optionSet.get(this);
  moduleOptions = assign(moduleOptions, {
    configPath: this.filepath || options.configPath,
  });

  return resolveModule(options, moduleOptions);
};

module.exports = Result;
