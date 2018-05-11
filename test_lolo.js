var test = require('./test.js');
var rt = require('./runtime.js');
var lolo = require('./lolo.js');

exports.tests = {}

if (require.main === module)
  process.exit(test.runTests(exports.tests));
