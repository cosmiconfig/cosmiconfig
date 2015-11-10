var test = require('tape');
var path = require('path');
var loadMulticonfig = require('..');

test('extend single config', function(t) {
  var planned = 0;

  loadMulticonfig(null, {
    allowExtends: true,
    config: path.join(__dirname, './fixtures/extends-foo-js.json'),
  })
    .then(function(result) {
      t.equal(result.config.foo, true);
    })
    .catch(function(err) {
      console.log(err.stack);
    });
  planned += 1;

  loadMulticonfig(null, {
    allowExtends: true,
    config: path.join(__dirname, './fixtures/extends-foo-yaml.js'),
  })
    .then(function(result) {
      t.equal(result.config.foo, true);
    })
    .catch(function(err) {
      console.log(err.stack);
    });
  planned += 1;


  loadMulticonfig(null, {
    allowExtends: true,
    rcName: 'extends-foo-json',
    cwd: path.join(__dirname, 'fixtures/horse/cat'),
  })
    .then(function(result) {
      t.equal(result.config.foo, true);
    })
    .catch(function(err) {
      console.log(err.stack);
    });
  planned += 1;

  t.plan(planned);
});

test('extend multiple configs', function(t) {
  var planned = 0;

  loadMulticonfig(null, {
    allowExtends: true,
    config: path.join(__dirname, './fixtures/extends-foo-bar'),
  })
    .then(function(result) {
      t.deepEqual(result.config, {
        foo: true,
        bar: true,
      });
      t.equal(result.filepath, path.join(__dirname, './fixtures/extends-foo-bar'));
    })
    .catch(function(err) {
      console.log(err.stack);
    });
  planned += 2;

  loadMulticonfig(null, {
    allowExtends: true,
    config: path.join(__dirname, './fixtures/extends-foo-contradicting-bar.hooha'),
  })
    .then(function(result) {
      t.deepEqual(result.config, {
        foo: true,
        bar: 1,
      });
      t.equal(result.filepath, path.join(__dirname, './fixtures/extends-foo-contradicting-bar.hooha'));
    })
    .catch(function(err) {
      console.log(err.stack);
    });
  planned += 2;

  t.plan(planned);
});

test('extend configs that themselves extend', function(t) {
  var planned = 0;

  loadMulticonfig(null, {
    allowExtends: true,
    jsName: 'extends-extending.js',
    cwd: path.join(__dirname, 'fixtures/horse/cat'),
  })
    .then(function(result) {
      t.deepEqual(result.config, {
        bar: true,
      });
      t.equal(result.filepath, path.join(__dirname, './fixtures/extends-extending.js'));
    })
    .catch(function(err) {
      console.log(err.stack);
    });
  planned += 2;

  t.plan(planned);
});
