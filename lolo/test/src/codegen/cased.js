var evaluate = require('../../lib/evaluate');
var rt = require('humbaba-runtime/humbaba-runtime');
var t = require('tap');

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
