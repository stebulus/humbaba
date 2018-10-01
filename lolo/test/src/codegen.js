var evaluate = require('../lib/evaluate');
var rt = require('../../../runtime/humbaba-runtime');
var t = require('tap');

function exprValue(astNode, expected, message) {
  t.strictSame(evaluate.expr(astNode), expected, message);
  t.strictSame(evaluate.exprOver(astNode), expected, message + ' (overwrite)');
}

exprValue(3, new rt.Box(3), 'numeric literal');
exprValue(null, new rt.Box(null), 'null literal');
exprValue({"str": "a string"}, new rt.Box("a string"), 'string literal');

exprValue({"let": [["x", 4]], in: "x"}, new rt.Box(4),
  'let, one var');
exprValue({"let": [["x", 4], ["y", 5]], in: "y"}, new rt.Box(5),
  'let, two vars');
exprValue({"let": [["x", 4], ["y", "x"]], in: "y"}, new rt.Box(4),
  'letrec, first var');
exprValue({"let": [["y", "x"], ["x", 4]], in: "y"}, new rt.Box(4),
  'letrec, second var');
exprValue(
  {"let": [["a", 5]], "in": {"let": [["a", 4]], "in": "a"}},
  new rt.Box(4), 'let in expr, shadowing variables');
exprValue(
  {"let": [["a", {"let": [["a", 4]], "in": "a"}]], "in": "a"},
  new rt.Box(4), 'let in binding, shadowing variables');

t.strictSame(evaluate.program({"declarations": [
  {"func": ["identity", "x"], "=": "x"},
  {"func": ["test"], "=": ["identity", 2]},
]}), new rt.Box(2), 'apply');

t.strictSame(evaluate.program({"declarations": [
  {"func": ["two"], "=": 2},
  {"func": ["test"], "=": "two"}
]}), new rt.Box(2), 'zero-argument function');

exprValue({"casei": 2, "of": [[2, 3], [3, 2], ["n", 8]]}, new rt.Box(3),
  'case of number, first branch');
exprValue({"casei": 2, "of": [[3, 2], [2, 3], ["n", 8]]}, new rt.Box(3),
  'case of number, second branch');
exprValue({"casei": 17, "of": [[3, 2], [2, 3], ["n", 8]]}, new rt.Box(8),
  'case of number, default branch');
t.strictSame(evaluate.program({"declarations": [
  {"func": ["identity", "x"], "=": "x"},
  {"func": ["test"],
   "=": {"casei": 2, "of": [["n", ["identity", "n"]]]}}
]}), new rt.Box(2), 'case of number, variable is set');

t.strictSame(evaluate.program({"declarations": [
  {"func": ["identity", "x"], "=": "x"},
  {"func": ["test"],
   "=": {"casei": ["identity", 2], "of": [[3, 2], [2, 3], ["n", 8]]}}
]}), new rt.Box(3), 'case of number, expression is evaluated');

exprValue(
  {"casec": {"str": "f"},
   "of": [[{"str": "f"}, {"str": "t"}], ["x", "x"]]},
  new rt.Box("t"),
  'case of char, match branch'
);
exprValue(
  {"casec": {"str": "g"},
   "of": [[{"str": "f"}, {"str": "t"}], ["x", "x"]]},
  new rt.Box("g"),
  'case of char, default branch'
);

t.strictSame(evaluate.program({"declarations": [
  {"data": "List",
   "=": [["Cons", 2], ["Nil", 0]]},
  {"func": ["test"],
   "=": {"cased": "Nil", "of": [["Nil", 4], ["Cons", "x", "y", 5]]}}
]}), new rt.Box(4), 'case of data, first branch');

t.strictSame(evaluate.program({"declarations": [
  {"data": "List",
   "=": [["Cons", 2], ["Nil", 0]]},
  {"func": ["identity", "x"], "=": "x"},
  {"func": ["test"],
   "=":
    ["identity",
      {"cased": "Nil", "of": [["Nil", 4], ["Cons", "x", "y", 5]]}]}
]}), new rt.Box(4), 'case of data, first branch (not overwrite)');

t.strictSame(evaluate.program({"declarations": [
  {"data": "List",
   "=": [["Cons", 2], ["Nil", 0]]},
  {"func": ["test"],
   "=": {"cased": "Nil", "of": [["Cons", "x", "y", 5], ["Nil", 4]]}}
]}), new rt.Box(4), 'case of data, second branch');

t.strictSame(evaluate.program({"declarations": [
  {"data": "List",
   "=": [["Cons", 2], ["Nil", 0]]},
  {"func": ["identity", "x"], "=": "x"},
  {"func": ["test"],
   "=": {"cased": ["identity", "Nil"], "of": [["Cons", "x", "y", 5], ["Nil", 4]]}}
]}), new rt.Box(4), 'case of data, expression is evaluated');

t.strictSame(evaluate.program({"declarations": [
  {"data": "List",
   "=": [["Cons", 2], ["Nil", 0]]},
  {"func": ["test"],
   "=": {"cased": ["Cons", 3, "Nil"],
         "of": [["Cons", "x", "y", "x"], ["Nil", 4]]}}
]}), new rt.Box(3), 'case of data, variable is set');

t.strictSame(evaluate.program({"declarations": [
  {"data": "List",
   "=": [["Cons", 2], ["Nil", 0]]},
  {"func": ["test"],
   "=": {"cased": ["Cons", 3, ["Cons", 2, "Nil"]],
         "of": [["Cons", "x", "y",
                 {"cased": "y",
                  "of": [["Cons", "h", "t", "h"], ["Nil", 7]]}],
                ["Nil", 4]]}}
]}), new rt.Box(2), 'case of data, variable is set and inspectable')

t.strictSame(evaluate.program({"declarations": [
  {"import": "Prim.Char"},
  {"data": "Bool", "=": [["True", 0], ["False", 0]]},
  {"func": ["id", "x"], "=": "x"},
  {"func": ["test"], "=":
    {"cased": ["Prim.Char.eq", 1, ["id", 0]],
     "of": [["True", "True"], ["False", "False"]]}}
]}), rt.False, 'case of data, expression is fully evaluated');
