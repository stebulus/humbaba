var test = require('./test.js');

exports.tests = {};

function addTests(name) {
  var tests = require(name).tests;
  for (var k in tests)
    exports.tests[name + ':' + k] = tests[k];
}

addTests('./test_runtime.js')
addTests('./test_test.js')
addTests('./test_lolo.js')

if (require.main === module)
  test.main(tests);
