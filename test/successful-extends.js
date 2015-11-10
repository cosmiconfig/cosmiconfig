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
