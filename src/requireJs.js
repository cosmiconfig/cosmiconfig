// @flow
'use strict';

const requireFromString = require('require-from-string');

function requireJs(content: string, filepath: string) {
  let result = requireFromString(content, filepath);

  /**
   * Handle ES Modules
   */
  if (typeof result === 'object' && result.__esModule) {
    if (result.default) {
      result = result.default;
    } else {
      const error = new Error(
        `${filepath} must use default export with ES Modules`
      );

      // $FlowFixMe
      error.code = 'ES_MODULES_DEFAULT_REQUIRED';

      throw error;
    }
  }

  return result;
}

module.exports = requireJs;
