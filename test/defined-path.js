var test = require('tape');
var path = require('path');
var loadMulticonfig = require('..');

test('defined JSON config path', function(t) {
  var planned = 0;

  loadMulticonfig(null, {
    config: path.join(__dirname, './fixtures/foo.json'),
  })
    .then(function(result) {
      t.deepEqual(result.config, {
        foo: true,
      });
      t.equal(result.filepath, path.join(__dirname, './fixtures/foo.json'));
    })
    .catch(function(err) {
      console.log(err.stack);
    });
  planned += 2;

  t.plan(planned);
});

test('defined YAML config path', function(t) {
  var planned = 0;

  loadMulticonfig(null, {
    config: path.join(__dirname, './fixtures/foo.yaml'),
  })
    .then(function(result) {
      t.deepEqual(result.config, {
        foo: true,
      });
      t.equal(result.filepath, path.join(__dirname, './fixtures/foo.yaml'));
    })
    .catch(function(err) {
      console.log(err.stack);
    });
  planned += 2;

  t.plan(planned);
});

test('defined JS config path', function(t) {
  var planned = 0;

  loadMulticonfig(null, {
    config: path.join(__dirname, './fixtures/foo.js'),
  })
    .then(function(result) {
      t.deepEqual(result.config, {
        foo: true,
      });
      t.equal(result.filepath, path.join(__dirname, './fixtures/foo.js'));
    })
    .catch(function(err) {
      console.log(err.stack);
    });
  planned += 2;

  t.plan(planned);
});

// test('defined JSON config path with syntax error', function(t) {
//   var planned = 0;
//
//   loadMulticonfig(null, {
//     config: path.join(__dirname, './fixtures/foo-invalid.json'),
//   })
//     .catch(function(error) {
//       t.ok(/^Failed to parse/.test(error.message), 'without format');
//     });
//   planned += 1;
//
//   loadMulticonfig(null, {
//     config: path.join(__dirname, './fixtures/foo-invalid.json'),
//     format: 'json',
//   })
//     .catch(function(error) {
//       console.log(error.name);
//       t.ok(/^Failed to parse/.test(error.message), 'with format');
//     });
//   planned += 1;
//
//   t.plan(planned);
// });
