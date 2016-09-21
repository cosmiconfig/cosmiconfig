'use strict';

const test = require('ava');
const path = require('path');
const cosmiconfig = require('..');

function absolutePath(str) {
  return path.join(__dirname, str);
}

test('defined JSON config path', (t) => {
  return cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo.json'),
  }).then((result) => {
    t.deepEqual(result.config, {
      foo: true,
    });
    t.is(result.filepath, absolutePath('fixtures/foo.json'));
  });
});

test('defined YAML config path', (t) => {
  return cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo.yaml'),
  }).then((result) => {
    t.deepEqual(result.config, {
      foo: true,
    });
    t.is(result.filepath, absolutePath('fixtures/foo.yaml'));
  });
});

test('defined JS config path', (t) => {
  return cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo.js'),
  }).then((result) => {
    t.deepEqual(result.config, {
      foo: true,
    });
    t.is(result.filepath, absolutePath('fixtures/foo.js'));
  });
});

test('defined modulized JS config path', (t) => {
  return cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo-module.js'),
  }).then((result) => {
    t.deepEqual(result.config, {
      foo: true,
    });
    t.is(result.filepath, absolutePath('fixtures/foo-module.js'));
  });
});
