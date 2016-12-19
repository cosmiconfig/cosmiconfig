process.cwd(__dirname);
process.versions.electron = "1.4.10";
var path = require("path");
var plugin = require('../editor-plugin/index.js');

process.on('message', (config) => {
  plugin(config).then(function(result) {
    process.send(result);
  });
});

