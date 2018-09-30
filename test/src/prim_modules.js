var evaluate = require('../lib/evaluate');
var rt = require('../../humbaba-runtime');
var t = require('tap');

t.strictSame(evaluate.program({"declarations":
  [ {"import": "Prim.Char"},
    {"func": ["test"], "=":
      ["Prim.Char.ord", {"str": "a"}]}
  ]
}), new rt.Box(97), 'charOrd(a)')
