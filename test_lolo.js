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

function exprOver(code) {
  var s = '(function () { var o = new rt.Empty(); ';
  function chunk(text) { s += text; }
  lolo.exprOverwrite(code, 'o', chunk);
  s += 'return o; })()';
  return eval(s);
}

function assertExprValue(expected, expression) {
  test.assertSame(expected, rt.smashIndirects(expr(expression)));
  test.assertSame(expected, rt.smashIndirects(exprOver(expression)));
}

exports.tests.numericLiteral = function () {
  assertExprValue(new rt.Box(3), 3);
};

exports.tests.booleanLiteral = function () {
  assertExprValue(new rt.Box(true), true);
};

exports.tests.nullLiteral = function () {
  assertExprValue(new rt.Box(null), null);
};

exports.tests.stringLiteral = function () {
  assertExprValue(new rt.Box("a string"), {"str": "a string"});
};

exports.tests.letAndVariable = function () {
  assertExprValue(new rt.Box(4), {"let": [["x", 4]], in: "x"});
};

exports.tests.letAndTwoVariables = function () {
  assertExprValue(new rt.Box(5),
    {"let": [["x", 4], ["y", 5]], in: "y"});
};

exports.tests.letrecAndVariable1 = function () {
  assertExprValue(new rt.Box(4),
    {"let": [["x", 4], ["y", "x"]], in: "y"});
};

exports.tests.letrecAndVariable2 = function () {
  assertExprValue(new rt.Box(4),
    {"let": [["y", "x"], ["x", 4]], in: "y"});
};

if (require.main === module)
  process.exit(test.runTests(exports.tests));
