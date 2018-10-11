var t = require('tap');
var tp = require('humbaba-runtime/test/lib/promise');
var ts = require('humbaba-runtime/test/lib/stream');
var stdout = require('../lib/runtime-stream').stdout;

tp.resolvesStrictSame(t,
  ts.output(stdout(
    {"declarations": [
      {"import": "Prim.IO"},
      {"import": "Prim.Unit"},
      {"func": ["test"], "=": ["Prim.IO.pure", "Prim.Unit.Unit"]}
    ]},
    null
  )).then(ts.asString),
  "",
  "null program"
);

tp.resolvesStrictSame(t,
  ts.output(stdout(
    {"declarations": [
      {"import": "Prim.IO"},
      {"func": ["test"], "=": ["Prim.IO.putChar", {"str": "x"}]}
    ]},
    null
  )).then(ts.asString),
  "x",
  "emit one char"
);

tp.resolvesStrictSame(t,
  ts.output(stdout(
    {"declarations": [
      {"import": "Prim.IO"},
      {"func": ["const", "x", "y"], "=": "x"},
      {"func": ["ioThen", "ioa", "iob"], "=":
        ["Prim.IO.bind", "ioa", ["const", "iob"]]},
      {"func": ["test"], "=":
        ["ioThen", ["Prim.IO.putChar", {"str": "x"}],
        ["ioThen", ["Prim.IO.putChar", {"str": "y"}],
                   ["Prim.IO.putChar", {"str": "z"}]]]}
    ]},
    null
  )).then(ts.asString),
  "xyz",
  "emit several chars"
);

tp.resolvesStrictSame(t,
  ts.output(stdout(
    {"declarations": [
      {"import": "Prim.IO"},
      {"func": ["test"], "=":
        ["Prim.IO.bind", "Prim.IO.getChar", "Prim.IO.putChar"]}
    ]},
    "x"
  )).then(ts.asString),
  "x",
  "copy one char"
);
