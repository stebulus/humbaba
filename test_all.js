var test = require('./test');

var tests = {};

function addTests(name) {
  var t = require(name).tests;
  for (var k in t)
    tests[name + ':' + k] = t[k];
}

addTests('./test_test.js');
addTests('./test_runtime.js');
addTests('./test_lolo.js');
addTests('./test_runtime_stream.js');

if (require.main === module)
  test.main(tests);
