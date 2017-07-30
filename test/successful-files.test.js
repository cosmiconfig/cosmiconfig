'use strict';

const test = require('tape');
const cosmiconfig = require('..');
const util = require('./util');

const absolutePath = util.absolutePath;
const failAssert = util.failAssert;

function doAsserts(assert, result, filePath) {
  assert.deepEqual(result.config, {
    foo: true,
  });
  assert.equal(result.filepath, filePath);
}

function makeFileTest(file) {
  const filePath = absolutePath(file);
  return function fileTest(assert) {
    const loadConfig = cosmiconfig().load;
    const loadConfigSync = cosmiconfig(null, { sync: true }).load;

    try {
      const result = loadConfigSync(null, filePath);
      doAsserts(assert, result, filePath);
      loadConfig(null, filePath)
        .then(result => {
          doAsserts(assert, result, filePath);
          assert.end();
        })
        .catch(err => {
          assert.end(err);
        });
    } catch (err) {
      assert.end(err);
    }
  };
}

function transform(result) {
  result.config.foo = [result.config.foo];
  return result;
}

// eslint-disable-next-line no-unused-vars
function transformWithError(result) {
  throw new Error('These pretzels are making me thirsty!');
}

test('defined JSON config path', makeFileTest('fixtures/foo.json'));

test('defined YAML config path', makeFileTest('fixtures/foo.yaml'));

test('defined JS config path', makeFileTest('fixtures/foo.js'));

test(
  'defined modularized JS config path',
  makeFileTest('fixtures/foo-module.js')
);

test('transform sync', assert => {
  // for testing transform, it should be enough to check for any 1 file type
  const filePath = absolutePath('fixtures/foo.json');
  const loadConfigSync = cosmiconfig(null, {
    sync: true,
    transform,
  }).load;

  try {
    const result = loadConfigSync(null, filePath);

    assert.deepEqual(
      result.config,
      { foo: [true] },
      'Result config should be transformed'
    );

    assert.end();
  } catch (err) {
    assert.end(err);
  }
});

test('transform async', assert => {
  // for testing transform, it should be enough to check for any 1 file type
  const filePath = absolutePath('fixtures/foo.json');
  const loadConfig = cosmiconfig(null, {
    transform,
  }).load;

  loadConfig(null, filePath)
    .then(result => {
      assert.deepEqual(
        result.config,
        { foo: [true] },
        'Result config should be transformed'
      );

      assert.end();
    })
    .catch(err => {
      assert.end(err);
    });
});

test('transform errors not swallowed in sync', assert => {
  const filePath = absolutePath('fixtures/foo.json');
  const loadConfigSync = cosmiconfig(null, {
    sync: true,
    transform: transformWithError,
  }).load;

  try {
    loadConfigSync(null, filePath);

    failAssert(assert);
  } catch (err) {
    assert.equal('These pretzels are making me thirsty!', err.message);
    assert.end();
  }
});

test('transform errors not swallowed in async', assert => {
  const filePath = absolutePath('fixtures/foo.json');
  const loadConfig = cosmiconfig(null, { transform: transformWithError }).load;

  loadConfig(null, filePath)
    // eslint-disable-next-line no-unused-vars
    .then(result => {
      failAssert(assert);
    })
    .catch(err => {
      assert.equal('These pretzels are making me thirsty!', err.message);
      assert.end();
    });
});
