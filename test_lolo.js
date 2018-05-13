var test = require('./test.js');
var rt = require('./runtime.js');
var lolo = require('./lolo.js');

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

function assertProgramValue(expected, program) {
  var s = '';
  function chunk(text) { s += text; }
  lolo.program(program, 'test', chunk);
  var expr = eval(s);
  rt.evaluate(expr);
  test.assertSame(expected, rt.smashIndirects(expr));
}

tests = {

  numericLiteral() {
    assertExprValue(new rt.Box(3), 3);
  },

  booleanLiteral() {
    assertExprValue(new rt.Box(true), true);
  },

  nullLiteral() {
    assertExprValue(new rt.Box(null), null);
  },

  stringLiteral() {
    assertExprValue(new rt.Box("a string"), {"str": "a string"});
  },

  letAndVariable() {
    assertExprValue(new rt.Box(4), {"let": [["x", 4]], in: "x"});
  },

  letAndTwoVariables() {
    assertExprValue(new rt.Box(5),
      {"let": [["x", 4], ["y", 5]], in: "y"});
  },

  letrecAndVariable1() {
    assertExprValue(new rt.Box(4),
      {"let": [["x", 4], ["y", "x"]], in: "y"});
  },

  letrecAndVariable2() {
    assertExprValue(new rt.Box(4),
      {"let": [["y", "x"], ["x", 4]], in: "y"});
  },

  apply() {
    assertProgramValue(new rt.Box(2), {"declarations": [
      {"func": ["identity", "x"], "=": "x"},
      {"func": ["test"], "=": ["identity", 2]},
    ]});
  },

};

exports.tests = tests;

if (require.main === module)
  process.exit(test.runTests(exports.tests));
