var evaluate = require('../lib/evaluate');
var rt = require('humbaba-runtime/humbaba-runtime');
var rts = require('humbaba-runtime/humbaba-runtime-stream');
var t = require('tap');

function withLoloParse(expr) {
  return evaluate.program({"declarations": [
    {"import": "Data.Bool", "as": "B"},
    {"import": "Data.List", "as": "L"},
    {"import": "Lolo.Parse", "as": "P"},
    {"func": ["test"], "=": expr}
  ]});
}

function charList(s) {
  var list = "L.Nil";
  for (var i = s.length - 1; i > -1; i--)
    list = ["L.Cons", {"str": s.charAt(i)}, list];
  return list;
}

function assertParseResult(parser, input, expected, message) {
  var expectedValue = withLoloParse(expected);
  var actualValue = withLoloParse(["P.parseList", parser, input]);
  t.strictSame(expectedValue, actualValue, message);
}

function assertParsed(parser, input, expected, message) {
  assertParseResult(parser, charList(input), ["Right", expected], message);
}

function assertParsedTokens(parser, input, expected, message) {
  assertParseResult(parser, input, ["Right", expected], message);
}

function assertParseFail(parser, input, message) {
  assertParseResult(parser, charList(input), ["Left", {"str": "f"}], message);
}

t.strictSame(
  withLoloParse(charList("350B")),
  withLoloParse(["P.hex4", 13579]),
  'hex4 odd number'
);

t.strictSame(
  withLoloParse(charList("09A4")),
  withLoloParse(["P.hex4", 2468]),
  'hex4 even number'
);

assertParsed(["P.char", {"str": "x"}], "x", {"str": "x"}, 'parse char');
assertParseFail(["P.char", {"str": "x"}], "y", 'parse char fail');

assertParsed("P.optsign", "+", "B.True", 'parse sign plus');
assertParsed("P.optsign", "-", "B.False", 'parse sign minus');
assertParsed("P.optsign", "", "B.True", 'parse sign absent');

assertParsed("P.digit", "3", {"str": "3"}, 'parse digit');
assertParseFail("P.digit", "a", 'parse digit fail');

assertParsed(
  ["P.pMany", "P.digit"],
  "34",
  ["L.Cons", {"str": "3"}, ["L.Cons", {"str": "4"}, "L.Nil"]],
  "parse digit many"
);

assertParseFail(["P.pMany", "P.digit"], "!", "parse digit many fail");

assertParsed(
  ["P.pSome", "P.digit"],
  "34",
  ["L.Cons", {"str": "3"}, ["L.Cons", {"str": "4"}, "L.Nil"]],
  "parse digit some"
);

assertParsed(["P.pSome", "P.digit"], "", "L.Nil", "parse digit some Nil");

assertParsed("P.intLiteral", "5", ["P.IntLiteral", 5],
  "parse int literal");
assertParsed("P.intLiteral", "+5", ["P.IntLiteral", 5],
  "parse int literal signed");
assertParsed("P.intLiteral", "-5", ["P.IntLiteral", -5],
  "parse int literal negative");
assertParsed("P.intLiteral", "5732", ["P.IntLiteral", 5732],
  "parse int literal multidigit");

assertParsed("P.item", "b", {"str": "b"}, "parse any char");

assertParsed("P.charLiteral", "'b'", ["P.CharLiteral", {"str": "b"}],
  "parse char literal");

t.strictSame(
  withLoloParse(["P.digitToInt", {"str": "2"}]),
  new rt.Box(2),
  "digit to int"
);

t.strictSame(
  withLoloParse(["P.readInt",
    ["L.Cons", {"str": "3"},
    ["L.Cons", {"str": "7"},
    ["L.Cons", {"str": "4"}, "L.Nil"]]]]),
  new rt.Box(374),
  "digits to int"
);

t.strictSame(
  withLoloParse(["P.charLe", {"str": "a"}, {"str": "a"}]),
  rt.True,
  "a <= a"
);

t.strictSame(
  withLoloParse(["P.charLe", {"str": "a"}, {"str": "b"}]),
  rt.True,
  "a <= b"
);

t.strictSame(
  withLoloParse(["P.charLe", {"str": "b"}, {"str": "a"}]),
  rt.False,
  "not (b <= a)"
);

t.strictSame(
  withLoloParse(["P.charBetween",
    {"str": "a"}, {"str": "b"}, {"str": "c"}]),
  rt.False,
  "c is not between a & b"
);


t.strictSame(
  withLoloParse(["P.charBetween",
    {"str": "a"}, {"str": "c"}, {"str": "b"}]),
  rt.True,
  "b is between a & c"
);

assertParsed(
  "P.varidOrReserved",
  "xY",
  ["P.VarId",
    ["L.Cons", {"str": "x"}, ["L.Cons", {"str": "Y"}, "L.Nil"]]],
  "varid"
);

assertParsed("P.varidOrReserved", "let", "P.Let", "reserved");

assertParsed("P.token", "(", "P.LParen", "symbol");

assertParsed("P.comment", "#fnord\n", "P.Unit", "comment");

assertParsed(["P.ignoreSome", "P.whitestuff"], "  #fnord\n \n", "P.Unit",
  "whitestuff");

assertParsed(
  ["P.pMany", "P.tokenInWhitespace"],
  "  foo  #comment! \nbar",
  ["L.Cons", ["P.VarId", charList("foo")],
  ["L.Cons", ["P.VarId", charList("bar")],
    "L.Nil"]],
  "commentInStuff"
);

assertParsedTokens(
  "P.exp",
  ["L.Cons", "P.Let",
    ["L.Cons", "P.LBrace",
    ["L.Cons", ["P.VarId", charList("x")],
    ["L.Cons", "P.Equals",
    ["L.Cons", ["P.IntLiteral", 3],
    ["L.Cons", "P.RBrace",
    ["L.Cons", "P.In",
    ["L.Cons", ["P.VarId", charList("f")],
    ["L.Cons", ["P.VarId", charList("x")],
     "L.Nil"]]]]]]]]],
  ["P.LetExp",
    ["L.Cons",
      ["P.Binding",
        charList("x"),
        ["P.FExp", ["L.Cons", ["P.AInt", 3], "L.Nil"]]],
      "L.Nil"],
    ["P.FExp",
      ["L.Cons", ["P.AVar", charList("f")],
      ["L.Cons", ["P.AVar", charList("x")],
       "L.Nil"]]]],
  "let exp 1"
);

assertParsedTokens(
  "P.exp",
  ["L.Cons", "P.Let",
    ["L.Cons", "P.LBrace",
    ["L.Cons", ["P.VarId", charList("x")],
    ["L.Cons", "P.Equals",
    ["L.Cons", ["P.IntLiteral", 3],
    ["L.Cons", "P.Semicolon",
    ["L.Cons", ["P.VarId", charList("y")],
    ["L.Cons", "P.Equals",
    ["L.Cons", ["P.VarId", charList("x")],
    ["L.Cons", "P.RBrace",
    ["L.Cons", "P.In",
    ["L.Cons", ["P.VarId", charList("f")],
    ["L.Cons", ["P.VarId", charList("y")],
     "L.Nil"]]]]]]]]]]]]],
  ["P.LetExp",
    ["L.Cons",
      ["P.Binding",
        charList("x"),
        ["P.FExp", ["L.Cons", ["P.AInt", 3], "L.Nil"]]],
      ["L.Cons",
        ["P.Binding",
          charList("y"),
          ["P.FExp", ["L.Cons", ["P.AVar", charList("x")], "L.Nil"]]],
        "L.Nil"]],
    ["P.FExp",
      ["L.Cons", ["P.AVar", charList("f")],
      ["L.Cons", ["P.AVar", charList("y")],
       "L.Nil"]]]],
  "let exp 2"
);

assertParsedTokens(
  "P.exp",
  ["L.Cons", "P.Cased",
    ["L.Cons", ["P.VarId", charList("f")],
    ["L.Cons", ["P.VarId", charList("x")],
    ["L.Cons", "P.Of",
    ["L.Cons", "P.LBrace",
    ["L.Cons", ["P.ConId", charList("Cons")],
    ["L.Cons", ["P.VarId", charList("hd")],
    ["L.Cons", ["P.VarId", charList("tl")],
    ["L.Cons", "P.Arrow",
    ["L.Cons", ["P.IntLiteral", 1],
    ["L.Cons", "P.Semicolon",
    ["L.Cons", ["P.ConId", charList("Nil")],
    ["L.Cons", "P.Arrow",
    ["L.Cons", ["P.IntLiteral", 0],
    ["L.Cons", "P.RBrace",
     "L.Nil"]]]]]]]]]]]]]]],
  ["P.CasedExp",
    ["P.FExp",
      ["L.Cons", ["P.AVar", charList("f")],
      ["L.Cons", ["P.AVar", charList("x")],
       "L.Nil"]]],
    ["L.Cons",
      ["P.DAlt",
        charList("Cons"),
        ["L.Cons", charList("hd"), ["L.Cons", charList("tl"), "L.Nil"]],
        ["P.FExp", ["L.Cons", ["P.AInt", 1], "L.Nil"]]],
    ["L.Cons",
      ["P.DAlt",
        charList("Nil"),
        "L.Nil",
        ["P.FExp", ["L.Cons", ["P.AInt", 0], "L.Nil"]]],
      "L.Nil"]]],
  "cased exp"
);

assertParsedTokens(
  "P.exp",
  ["L.Cons", "P.Casei",
    ["L.Cons", ["P.VarId", charList("f")],
    ["L.Cons", ["P.VarId", charList("x")],
    ["L.Cons", "P.Of",
    ["L.Cons", "P.LBrace",
    ["L.Cons", ["P.IntLiteral", 3],
    ["L.Cons", "P.Arrow",
    ["L.Cons", ["P.IntLiteral", 1],
    ["L.Cons", "P.Semicolon",
    ["L.Cons", ["P.VarId", charList("foo")],
    ["L.Cons", "P.Arrow",
    ["L.Cons", ["P.IntLiteral", 0],
    ["L.Cons", "P.RBrace",
     "L.Nil"]]]]]]]]]]]]],
  ["P.CaseiExp",
    ["P.FExp",
      ["L.Cons", ["P.AVar", charList("f")],
      ["L.Cons", ["P.AVar", charList("x")],
       "L.Nil"]]],
    ["L.Cons",
      ["P.IAltInt",
        3,
        ["P.FExp", ["L.Cons", ["P.AInt", 1], "L.Nil"]]],
    ["L.Cons",
      ["P.IAltVar",
        charList("foo"),
        ["P.FExp", ["L.Cons", ["P.AInt", 0], "L.Nil"]]],
      "L.Nil"]]],
  "casei exp"
);

assertParsedTokens(
  "P.exp",
  ["L.Cons", "P.Casec",
    ["L.Cons", ["P.VarId", charList("f")],
    ["L.Cons", ["P.VarId", charList("x")],
    ["L.Cons", "P.Of",
    ["L.Cons", "P.LBrace",
    ["L.Cons", ["P.CharLiteral", {"str": "a"}],
    ["L.Cons", "P.Arrow",
    ["L.Cons", ["P.IntLiteral", 1],
    ["L.Cons", "P.Semicolon",
    ["L.Cons", ["P.VarId", charList("foo")],
    ["L.Cons", "P.Arrow",
    ["L.Cons", ["P.IntLiteral", 0],
    ["L.Cons", "P.RBrace",
     "L.Nil"]]]]]]]]]]]]],
  ["P.CasecExp",
    ["P.FExp",
      ["L.Cons", ["P.AVar", charList("f")],
      ["L.Cons", ["P.AVar", charList("x")],
       "L.Nil"]]],
    ["L.Cons",
      ["P.CAltChar",
        {"str": "a"},
        ["P.FExp", ["L.Cons", ["P.AInt", 1], "L.Nil"]]],
    ["L.Cons",
      ["P.CAltVar",
        charList("foo"),
        ["P.FExp", ["L.Cons", ["P.AInt", 0], "L.Nil"]]],
      "L.Nil"]]],
  "casec exp"
);

assertParsedTokens(
  "P.decl",
  ["L.Cons", "P.Data",
    ["L.Cons", ["P.ConId", charList("List")],
    ["L.Cons", "P.Equals",
    ["L.Cons", ["P.ConId", charList("Cons")],
    ["L.Cons", ["P.IntLiteral", 2],
    ["L.Cons", "P.Pipe",
    ["L.Cons", ["P.ConId", charList("Nil")],
    ["L.Cons", ["P.IntLiteral", 0],
     "L.Nil"]]]]]]]],
  ["P.DataDecl",
    charList("List"),
    ["L.Cons", ["P.ConDecl", charList("Cons"), 2],
    ["L.Cons", ["P.ConDecl", charList("Nil"), 0],
     "L.Nil"]]],
  "data decl"
);

assertParsedTokens(
  "P.decl",
  ["L.Cons", ["P.VarId", charList("const")],
    ["L.Cons", ["P.VarId", charList("first")],
    ["L.Cons", ["P.VarId", charList("second")],
    ["L.Cons", "P.Equals",
    ["L.Cons", ["P.VarId", charList("first")],
     "L.Nil"]]]]],
  ["P.FuncDecl",
    charList("const"),
    ["L.Cons", charList("first"),
    ["L.Cons", charList("second"),
     "L.Nil"]],
    ["P.FExp", ["L.Cons", ["P.AVar", charList("first")], "L.Nil"]]],
  "func decl"
);
