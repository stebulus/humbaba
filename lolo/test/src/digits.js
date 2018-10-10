var evaluate = require('../lib/evaluate');
var rt = require('humbaba-runtime/humbaba-runtime');
var t = require('tap');

function withDigits(expr) {
  return evaluate.program({"declarations": [
    {"import": "Data.List", "as": "L"},
    {"import": "Lolo.Digits", "as": "D"},
    {"func": ["test"], "=": expr}
  ]});
}

t.strictSame(
  withDigits(["D.digitToInt", {"str": "2"}]),
  new rt.Box(2),
  "digit to int"
);

t.strictSame(
  withDigits(["D.readInt",
    ["L.Cons", {"str": "3"},
    ["L.Cons", {"str": "7"},
    ["L.Cons", {"str": "4"}, "L.Nil"]]]]),
  new rt.Box(374),
  "digits to int"
);
