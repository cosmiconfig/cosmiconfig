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
