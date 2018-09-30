var ts = require('./lib/stream');
var stdout = require('./lib/runtime_stream').stdout;

ts.output(
  stdout(
    {"declarations": [
      {"import": "Prim.IO"},
      {"import": "Prim.Unit"},
      {"func": ["test"], "=": ["Prim.IO.pure", "Prim.Unit.Unit"]}
    ]},
    null
  ),
  ts.asString,
  "",
  "null program"
);

ts.output(
  stdout(
    {"declarations": [
      {"import": "Prim.IO"},
      {"func": ["test"], "=": ["Prim.IO.putChar", {"str": "x"}]}
    ]},
    null
  ),
  ts.asString,
  "x",
  "emit one char"
);

ts.output(
  stdout(
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
  ),
  ts.asString,
  "xyz",
  "emit several chars"
);

ts.output(
  stdout(
    {"declarations": [
      {"import": "Prim.IO"},
      {"func": ["test"], "=":
        ["Prim.IO.bind", "Prim.IO.getChar", "Prim.IO.putChar"]}
    ]},
    "x"
  ),
  ts.asString,
  "x",
  "copy one char"
);
