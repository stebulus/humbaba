var test = require('./lib/test');
var rt = require('humbaba/runtime');
var codegen = require('humbaba/lolo_codegen');

function expr(astNode) {
  var s = '';
  function chunk(text) { s += text; }
  codegen.expr(astNode, chunk);
  return eval(s);
}

function exprOver(astNode) {
  var s = '(function () { var o = new rt.Empty(); ';
  function chunk(text) { s += text; }
  codegen.expr(astNode, chunk, 'o');
  s += 'return o; })()';
  return eval(s);
}

function assertExprValue(expected, astNode) {
  var ex = expr(astNode);
  rt.evaluate(ex);
  test.assertSame(expected, rt.smashIndirects(ex));
  ex = exprOver(astNode);
  rt.evaluate(ex);
  test.assertSame(expected, rt.smashIndirects(ex));
}

function programValue(ast) {
  var expr = eval(codegen.programToJavaScript(ast, 'test'));
  rt.evaluateDeep(expr);
  return rt.smashIndirects(expr);
}
exports.programValue = programValue;

function assertProgramValue(expected, ast) {
  test.assertSame(expected, programValue(ast));
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
      {"casei": 2, "of": [[2, 3], [3, 2], ["n", 8]]});
  },

  caseNumber2() {
    assertExprValue(new rt.Box(3),
      {"casei": 2, "of": [[3, 2], [2, 3], ["n", 8]]});
  },

  caseNumberDefault() {
    assertExprValue(new rt.Box(8),
      {"casei": 17, "of": [[3, 2], [2, 3], ["n", 8]]});
  },

  caseNumberVariable() {
    assertProgramValue(new rt.Box(2), {"declarations": [
      {"func": ["identity", "x"], "=": "x"},
      {"func": ["test"],
       "=": {"casei": 2, "of": [["n", ["identity", "n"]]]}}
    ]});
  },

  caseNumberEvaluate() {
    assertProgramValue(new rt.Box(3), {"declarations": [
      {"func": ["identity", "x"], "=": "x"},
      {"func": ["test"],
       "=": {"casei": ["identity", 2], "of": [[3, 2], [2, 3], ["n", 8]]}}
    ]});
  },

  caseChar1() {
    assertExprValue(new rt.Box("t"),
      {"casec": {"str": "f"},
       "of": [[{"str": "f"}, {"str": "t"}], ["x", "x"]]});
  },

  caseChar2() {
    assertExprValue(new rt.Box("g"),
      {"casec": {"str": "g"},
       "of": [[{"str": "f"}, {"str": "t"}], ["x", "x"]]});
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

  caseWithNestedEvaluand() {
    assertProgramValue(rt.False, {"declarations": [
      {"data": "Bool", "=": [["True", 0], ["False", 0]]},
      {"func": ["id", "x"], "=": "x"},
      {"func": ["test"], "=":
        {"cased": ["charEq", 1, ["id", 0]],
         "of": [["True", "True"], ["False", "False"]]}}
    ]});
  },

};

exports.tests = tests;

if (require.main === module)
  test.main(tests);