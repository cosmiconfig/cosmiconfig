// @flow
'use strict';

function tryNextLoader(
  prevResult: CosmiconfigResult,
  options: { ignoreEmpty: boolean }
) {
  return prevResult === null || (prevResult.isEmpty && options.ignoreEmpty);
}

function loaderSeries(
  loaders: Array<(CosmiconfigResult) => null | Promise<CosmiconfigResult>>,
  options: { ignoreEmpty: boolean }
): Promise<CosmiconfigResult> {
  return loaders.reduce((prev, nextLoader) => {
    if (prev === null) return Promise.resolve(nextLoader(null));
    return prev.then(prevResult => {
      if (tryNextLoader(prevResult, options)) {
        return nextLoader(prevResult);
      }
      return prevResult;
    });
  }, Promise.resolve(null));
}

loaderSeries.sync = function loaderSeriesSync(
  loaders: Array<(CosmiconfigResult) => CosmiconfigResult>,
  options: { ignoreEmpty: boolean }
): CosmiconfigResult {
  let result = null;
  for (const loader of loaders) {
    result = loader(result);
    if (!tryNextLoader(result, options)) break;
  }
  return result;
};

module.exports = loaderSeries;
