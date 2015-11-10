# load-multiconfig [![Build Status](https://travis-ci.org/davidtheclark/load-multiconfig.svg?branch=master)](https://travis-ci.org/davidtheclark/load-multiconfig)

Find and load config from a package.json property, rc file (JSON or YAML), or CommonJS module.

## Intended API

```js
var loadMulticonfig = require('load-multiconfig');

loadMulticonfig('mymodule'[, options]).then(function(result) {
  // result.config is the parsed configuration object
  // result.filepath is the path to the config file that was found
});
```
