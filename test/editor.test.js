'use strict';
var test = require('ava');
var path = require('path');
var cp = require('child_process');

function absolutePath(str) {
  return path.join(__dirname, str);
}

function testCase(moduleName, options) {
  return new Promise(function (resolve){
    var n = cp.fork(path.join(__dirname, 'fixtures/editor/editor-program/index.js'));

    n.on('message', function (result) {
      resolve(result);
      n.kill();
    });

    n.send({
      moduleName: moduleName,
      options: options,
    });
  });
}

test.before(function () {
  cp.execSync('npm i ' + absolutePath('..'), {
    cwd: absolutePath('fixtures/editor/editor-plugin/'),
    stdio: 'inherit',
  });
});

test('plugin path lookup', function (assert) {
  return testCase('test').then(function (result) {
    assert.deepEqual(result.config.plugins, [
      absolutePath('fixtures/editor/project/index.css'),
      './not-exist',
      absolutePath('fixtures/editor/project/node_modules/module-proj.js'),
      absolutePath('fixtures/editor/editor-plugin/node_modules/module-editor-plugin.js'),
    ]);
    assert.deepEqual(result.filepath, absolutePath('fixtures/editor/project/.testrc'));

  });
});
