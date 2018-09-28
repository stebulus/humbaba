var output = require('./lib/stream').output;
var stdout = require('./lib/runtime_stream').stdout;

output(
  stdout(
    {"declarations": [
      {"import": "Prim.IO"},
      {"import": "Prim.Unit"},
      {"func": ["test"], "=": ["Prim.IO.pure", "Prim.Unit.Unit"]}
    ]},
    null
  ),
  "",
  "null program"
);

output(
  stdout(
    {"declarations": [
      {"import": "Prim.IO"},
      {"func": ["test"], "=": ["Prim.IO.putChar", {"str": "x"}]}
    ]},
    null
  ),
  "x",
  "emit one char"
);

output(
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
  "xyz",
  "emit several chars"
);

output(
  stdout(
    {"declarations": [
      {"import": "Prim.IO"},
      {"func": ["test"], "=":
        ["Prim.IO.bind", "Prim.IO.getChar", "Prim.IO.putChar"]}
    ]},
    "x"
  ),
  "x",
  "copy one char"
);
