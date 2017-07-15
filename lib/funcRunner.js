'use strict';

var isPromise = require('is-promise');

/**
 * Runs given functions. If the `init` param is a promise, functions are
 * chained using `p.then()`. Otherwise, functions are chained by passing
 * the result of each function to the next.
 *
 * @param {*} init
 * @param {Array<Function>} funcs
 * @returns {*} A promise if `init` was one, otherwise result of function
 * chain execution.
 */
module.exports = function funcRunner(init, funcs) {
  var async = isPromise(init);

  var res = init;
  funcs.forEach(function (func) {
    if (async === true) res = res.then(func);
    else res = func(res);
  });

  return res;
};
