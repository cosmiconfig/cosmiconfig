var test = require('tape');
var path = require('path');
var cosmiconfig = require('..');

test('extend nonexistent file', function(t) {
  var planned = 0;

  cosmiconfig(null, {
    allowExtends: true,
    config: path.join(__dirname, './fixtures/extends-nonexistent.json'),
  })
    .catch(function(err) {
      t.ok(/\/does\/not\/exist/.test(err.message));
    });
  planned += 1;

  t.plan(planned);
});

test('extend invalid file', function(t) {
  var planned = 0;

  cosmiconfig(null, {
    allowExtends: true,
    config: path.join(__dirname, './fixtures/extends-invalid.yaml'),
  })
    .catch(function(err) {
      t.ok(/^Failed to parse/.test(err.message));
    });
  planned += 1;

  t.plan(planned);
});

test('extends another that extends nonexistent file', function(t) {
  var planned = 0;

  cosmiconfig(null, {
    allowExtends: true,
    config: path.join(__dirname, './fixtures/extends-extending-nonexistent.js'),
  })
    .catch(function(err) {
      t.ok(/\/does\/not\/exist/.test(err.message));
    });
  planned += 1;

  t.plan(planned);
});
