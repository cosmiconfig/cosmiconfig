'use strict';

const test = require('ava');
const path = require('path');
const cosmiconfig = require('..');

function absolutePath(str) {
  return path.join(__dirname, str);
}

test('defined file that does not exist', (t) => {
  return cosmiconfig(null, {
    configPath: absolutePath('does/not/exist'),
  }).catch((error) => {
    t.is(error.code, 'ENOENT', 'with expected format');
  });
});

test('defined JSON file with syntax error, without expected format', (t) => {
  return cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo-invalid.json'),
  }).catch((error) => {
    t.truthy(/^Failed to parse/.test(error.message));
  });
});

test('defined JSON file with syntax error, with expected format', (t) => {
  return cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo-invalid.json'),
    format: 'json',
  }).catch((error) => {
    t.is(error.name, 'JSONError');
  });
});

test('defined YAML file with syntax error, without expected format', (t) => {
  return cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo-invalid.yaml'),
  }).catch((error) => {
    t.truthy(/^Failed to parse/.test(error.message));
  });
});

test('defined YAML file with syntax error, with expected format', (t) => {
  return cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo-invalid.yaml'),
    format: 'yaml',
  }).catch((error) => {
    t.is(error.name, 'YAMLException');
  });
});

test('defined JS file with syntax error, without expected format', (t) => {
  return cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo-invalid.js'),
  }).catch((error) => {
    t.truthy(/^Failed to parse/.test(error.message));
  });
});

test('defined JS file with syntax error, with expected format', (t) => {
  return cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo-invalid.js'),
    format: 'js',
  }).catch((error) => {
    t.truthy(!/^Failed to parse/.test(error.message));
  });
});
