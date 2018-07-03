var test = require('./lib/test');

var tests = {};

function addTests(name) {
  var t = require(name).tests;
  for (var k in t)
    tests[name + ':' + k] = t[k];
}

addTests('./test.js');
addTests('./runtime.js');
addTests('./lolo_codegen.js');
addTests('./runtime_stream.js');
addTests('./runtime_stream_cat.js');
addTests('./lolo_stream.js');
addTests('./lolo_parse.js');
addTests('./lolo_parse_e2e.js');

if (require.main === module)
  test.main(tests);
