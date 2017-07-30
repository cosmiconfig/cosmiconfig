'use strict';

const isPromise = require('is-promise');

const chainFuncsAsync = (result, func) => result.then(func);
const chainFuncsSync = (result, func) => func(result);

/**
 * Runs the given functions sequentially. If the `init` param is a promise,
 * functions are chained using `p.then()`. Otherwise, functions are chained by passing
 * the result of each function to the next.
 *
 * @param {Promise | void} init
 * @param {Array<Function>} funcs
 * @returns {Promise<*> | *} - A promise if `init` was one, otherwise result of function
 * chain execution.
 */
module.exports = function funcRunner(init, funcs) {
  const isAsync = isPromise(init);

  return funcs.reduce(
    isAsync === true ? chainFuncsAsync : chainFuncsSync,
    init
  );
};
