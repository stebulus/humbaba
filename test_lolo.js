var test = require('./test.js');
var rt = require('./runtime.js');
var lolo = require('./lolo.js');

exports.tests = {}

function expr(code) {
  var s = '';
  function chunk(text) { s += text; }
  lolo.exprToExpr(code, chunk);
  return eval(s);
}

exports.tests.numericLiteral = function () {
  test.assertSame(new rt.Box(3), expr(3));
};

exports.tests.booleanLiteral = function () {
  test.assertSame(new rt.Box(true), expr(true));
};

exports.tests.nullLiteral = function () {
  test.assertSame(new rt.Box(null), expr(null));
};

exports.tests.stringLiteral = function () {
  test.assertSame(new rt.Box("a string"), expr({"str": "a string"}));
};

if (require.main === module)
  process.exit(test.runTests(exports.tests));
