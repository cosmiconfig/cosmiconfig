'use strict';

//
// this is one solution to make importFresh spy'able
// see: https://github.com/sinonjs/sinon/issues/664
//

const importFresh = require('import-fresh');

module.exports = { importFresh };
