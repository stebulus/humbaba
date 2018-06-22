var test = require('./test');
var rt = require('./runtime');
var lolo = require('./lolo');

function expr(code) {
  var s = '';
  function chunk(text) { s += text; }
  lolo.expr(code, chunk);
  return eval(s);
}

function exprOver(code) {
  var s = '(function () { var o = new rt.Empty(); ';
  function chunk(text) { s += text; }
  lolo.expr(code, chunk, 'o');
  s += 'return o; })()';
  return eval(s);
}

function assertExprValue(expected, expression) {
  var ex = expr(expression);
  rt.evaluate(ex);
  test.assertSame(expected, rt.smashIndirects(ex));
  ex = exprOver(expression);
  rt.evaluate(ex);
  test.assertSame(expected, rt.smashIndirects(ex));
}

function programValue(program) {
  var chunks = [];
  function chunk(text) { chunks.push(text); }
  lolo.program(program, 'test', chunk);
  var expr = eval(chunks.join(''));
  rt.evaluate(expr);
  return rt.smashIndirects(expr);
}
exports.programValue = programValue;

function assertProgramValue(expected, program) {
  test.assertSame(expected, programValue(program));
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

  caseNumber1() {
    assertExprValue(new rt.Box(3),
      {"casel": 2, "of": [[2, 3], [3, 2], ["n", 8]]});
  },

  caseNumber2() {
    assertExprValue(new rt.Box(3),
      {"casel": 2, "of": [[3, 2], [2, 3], ["n", 8]]});
  },

  caseNumberDefault() {
    assertExprValue(new rt.Box(8),
      {"casel": 17, "of": [[3, 2], [2, 3], ["n", 8]]});
  },

  caseNumberVariable() {
    assertProgramValue(new rt.Box(2), {"declarations": [
      {"func": ["identity", "x"], "=": "x"},
      {"func": ["test"],
       "=": {"casel": 2, "of": [["n", ["identity", "n"]]]}}
    ]});
  },

  caseNumberEvaluate() {
    assertProgramValue(new rt.Box(3), {"declarations": [
      {"func": ["identity", "x"], "=": "x"},
      {"func": ["test"],
       "=": {"casel": ["identity", 2], "of": [[3, 2], [2, 3], ["n", 8]]}}
    ]});
  },

  caseBoolean1() {
    assertExprValue(new rt.Box(3),
      {"casel": true, "of": [[true, 3], [false, 2]]});
  },

  caseBoolean2() {
    assertExprValue(new rt.Box(3),
      {"casel": true, "of": [[false, 2], [true, 3]]});
  },

  caseString1() {
    assertExprValue(new rt.Box(3),
      {"casel": {"str": "foo"},
       "of": [[{"str": "foo"}, 3], [{"str": "bar"}, 2]]});
  },

  caseString2() {
    assertExprValue(new rt.Box(3),
      {"casel": {"str": "foo"},
       "of": [[{"str": "bar"}, 2], [{"str": "foo"}, 3]]});
  },

  caseData1() {
    assertProgramValue(new rt.Box(4), {"declarations": [
      {"data": "List",
       "=": [["Cons", 2], ["Nil", 0]]},
      {"func": ["test"],
       "=": {"cased": "Nil", "of": [["Nil", 4], ["Cons", "x", "y", 5]]}}
    ]});
  },

  caseData2() {
    assertProgramValue(new rt.Box(4), {"declarations": [
      {"data": "List",
       "=": [["Cons", 2], ["Nil", 0]]},
      {"func": ["test"],
       "=": {"cased": "Nil", "of": [["Cons", "x", "y", 5], ["Nil", 4]]}}
    ]});
  },

  caseDataEvaluate() {
    assertProgramValue(new rt.Box(4), {"declarations": [
      {"data": "List",
       "=": [["Cons", 2], ["Nil", 0]]},
      {"func": ["identity", "x"], "=": "x"},
      {"func": ["test"],
       "=": {"cased": ["identity", "Nil"], "of": [["Cons", "x", "y", 5], ["Nil", 4]]}}
    ]});
  },

  caseDataVariables1() {
    assertProgramValue(new rt.Box(3), {"declarations": [
      {"data": "List",
       "=": [["Cons", 2], ["Nil", 0]]},
      {"func": ["test"],
       "=": {"cased": ["Cons", 3, "Nil"],
             "of": [["Cons", "x", "y", "x"], ["Nil", 4]]}}
    ]});
  },

  caseDataVariables2() {
    assertProgramValue(new rt.Box(2), {"declarations": [
      {"data": "List",
       "=": [["Cons", 2], ["Nil", 0]]},
      {"func": ["test"],
       "=": {"cased": ["Cons", 3, ["Cons", 2, "Nil"]],
             "of": [["Cons", "x", "y",
                     {"cased": "y",
                      "of": [["Cons", "h", "t", "h"], ["Nil", 7]]}],
                    ["Nil", 4]]}}
    ]});
  },

};

exports.tests = tests;

if (require.main === module)
  test.main(tests);
