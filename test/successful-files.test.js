'use strict';

var test = require('tape');
var path = require('path');
var cosmiconfig = require('..');

function absolutePath(str) {
  return path.join(__dirname, str);
}

function doAsserts(assert, result, filePath) {
  assert.deepEqual(result.config, {
    foo: true,
  });
  assert.equal(result.filepath, filePath);
}

function makeFileTest(file) {
  var filePath = absolutePath(file);
  return function fileTest(assert) {
    var loadConfig = cosmiconfig().load;
    var loadConfigSync = cosmiconfig(null, { sync: true }).load;

    try {
      var result = loadConfigSync(null, filePath);
      doAsserts(assert, result, filePath);
      loadConfig(null, absolutePath(file)).then(function (result) {
        doAsserts(assert, result, filePath);
        assert.end();
      }).catch(function (err) {
        assert.end(err);
      });
    } catch (err) {
      assert.end(err);
    }
  };
}

test('defined JSON config path', makeFileTest('fixtures/foo.json'));

test('defined YAML config path', makeFileTest('fixtures/foo.yaml'));

test('defined JS config path', makeFileTest('fixtures/foo.js'));

test('defined modulized JS config path', makeFileTest('fixtures/foo-module.js'));
