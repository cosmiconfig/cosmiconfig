var test = require('ava');
var path = require('path');
var cosmiconfig = require('..');

function absolutePath(str) {
  return path.join(__dirname, str);
}

test('defined JSON config path with rcStrictJson', function(t) {
  return cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo.json'),
  }).then(function(result) {
    t.same(result.config, {
      foo: true,
    });
    t.is(result.filepath, absolutePath('fixtures/foo.json'));
  });
});

test('defined YAML config path', function(t) {
  return cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo.yaml'),
  }).then(function(result) {
    t.same(result.config, {
      foo: true,
    });
    t.is(result.filepath, absolutePath('fixtures/foo.yaml'));
  });
});

test('defined JS config path', function(t) {
  return cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo.js'),
  }).then(function(result) {
    t.same(result.config, {
      foo: true,
    });
    t.is(result.filepath, absolutePath('fixtures/foo.js'));
  });
});
