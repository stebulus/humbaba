var llp = require('../../lib/lolo-parse');
var t = require('tap');
var tp = require('../../lib/promise');
var ts = require('../../lib/stream');
var stdout = require('../../lib/runtime-stream').stdout;

var lolo_parse_program = llp.withLoloParseProgram("main")

function lolo_parse(input, expected, message) {
  tp.resolvesStrictSame(t,
    ts.output(stdout(lolo_parse_program, input)).then(ts.asJSON),
    expected,
    message
  );
}

lolo_parse(
  "{ main = putChar 'x' }",
  {"declarations": [
    {"func": ["main"], "=": ["putChar", {"str": "x"}]}
  ]},
  "main decl"
);

lolo_parse(
  "{ data List = Cons 2 | Nil 0 }",
  {"declarations": [
    {"data": "List", "=": [["Cons", 2], ["Nil", 0]]}
  ]},
  "data decl"
);

lolo_parse(
  "{ main = cased x of { True > Unit ; False > Unit } }",
  {"declarations": [
    {"func": ["main"], "=":
      {"cased": "x", "of": [["True", "Unit"], ["False", "Unit"]]}}
  ]},
  "func with cased"
);

lolo_parse(
  "{ main = casec x of { '?' > Unit ; _ > Unit } }",
  {"declarations": [
    {"func": ["main"], "=":
      {"casec": "x", "of": [[{"str": "?"}, "Unit"], ["_", "Unit"]]}}
  ]},
  "func with casec"
);

lolo_parse(
  "{ main = casei x of { 3 > Unit ; _ > Unit } }",
  {"declarations": [
    {"func": ["main"], "=":
      {"casei": "x", "of": [[3, "Unit"], ["_", "Unit"]]}}
  ]},
  "func with casei"
);

lolo_parse(
  "{ main = let { x = 3 ; y = x } in y }",
  {"declarations": [
    {"func": ["main"], "=":
      {"let": [["x", 3], ["y", "x"]], "in": "y"}}
  ]},
  "func with let"
);
