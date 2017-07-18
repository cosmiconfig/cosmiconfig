'use strict';

var test = require('tape');
var path = require('path');
var cosmiconfig = require('..');

function absolutePath(str) {
  return path.join(__dirname, str);
}

test('options.configPath is respected', function (assert) {
  var configPath = absolutePath('fixtures/foo.json');
  var explorer = cosmiconfig('foo', { configPath: configPath });
  explorer.load('./path/does/not/exist').then(function (result) {
    assert.deepEqual(result.config, {
      foo: true,
    });
    assert.equal(result.filepath, configPath);
    assert.end();
  }).catch(function (err) {
    assert.end(err);
  });
});
