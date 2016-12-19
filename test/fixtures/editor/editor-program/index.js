'use strict';
process.cwd(__dirname);
process.versions.electron = '1.4.10';
var plugin = require('../editor-plugin/index.js');

process.on('message', function (config) {
  plugin(config).then(function (result) {
    process.send(result);
  });
});

