var evaluate = require('../lib/evaluate');
var rt = require('../../../runtime/humbaba-runtime');
var rts = require('../../../runtime/humbaba-runtime-stream');
var t = require('tap');

function withLoloParse(expr) {
  return evaluate.program({"declarations": [
    {"import": "Lolo.Parse", "as": "P"},
    {"func": ["test"], "=": expr}
  ]});
}

function charList(s) {
  var list = "P.Nil";
  for (var i = s.length - 1; i > -1; i--)
    list = ["P.Cons", {"str": s.charAt(i)}, list];
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

assertParsed("P.optsign", "+", "P.True", 'parse sign plus');
assertParsed("P.optsign", "-", "P.False", 'parse sign minus');
assertParsed("P.optsign", "", "P.True", 'parse sign absent');

assertParsed("P.digit", "3", {"str": "3"}, 'parse digit');
assertParseFail("P.digit", "a", 'parse digit fail');

assertParsed(
  ["P.pMany", "P.digit"],
  "34",
  ["P.Cons", {"str": "3"}, ["P.Cons", {"str": "4"}, "P.Nil"]],
  "parse digit many"
);

assertParseFail(["P.pMany", "P.digit"], "!", "parse digit many fail");

assertParsed(
  ["P.pSome", "P.digit"],
  "34",
  ["P.Cons", {"str": "3"}, ["P.Cons", {"str": "4"}, "P.Nil"]],
  "parse digit some"
);

assertParsed(["P.pSome", "P.digit"], "", "P.Nil", "parse digit some Nil");

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
    ["P.Cons", {"str": "3"},
    ["P.Cons", {"str": "7"},
    ["P.Cons", {"str": "4"}, "P.Nil"]]]]),
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
    ["P.Cons", {"str": "x"}, ["P.Cons", {"str": "Y"}, "P.Nil"]]],
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
  ["P.Cons", ["P.VarId", charList("foo")],
  ["P.Cons", ["P.VarId", charList("bar")],
    "P.Nil"]],
  "commentInStuff"
);

assertParsedTokens(
  "P.exp",
  ["P.Cons", "P.Let",
    ["P.Cons", "P.LBrace",
    ["P.Cons", ["P.VarId", charList("x")],
    ["P.Cons", "P.Equals",
    ["P.Cons", ["P.IntLiteral", 3],
    ["P.Cons", "P.RBrace",
    ["P.Cons", "P.In",
    ["P.Cons", ["P.VarId", charList("f")],
    ["P.Cons", ["P.VarId", charList("x")],
     "P.Nil"]]]]]]]]],
  ["P.LetExp",
    ["P.Cons",
      ["P.Binding",
        charList("x"),
        ["P.FExp", ["P.Cons", ["P.AInt", 3], "P.Nil"]]],
      "P.Nil"],
    ["P.FExp",
      ["P.Cons", ["P.AVar", charList("f")],
      ["P.Cons", ["P.AVar", charList("x")],
       "P.Nil"]]]],
  "let exp 1"
);

assertParsedTokens(
  "P.exp",
  ["P.Cons", "P.Let",
    ["P.Cons", "P.LBrace",
    ["P.Cons", ["P.VarId", charList("x")],
    ["P.Cons", "P.Equals",
    ["P.Cons", ["P.IntLiteral", 3],
    ["P.Cons", "P.Semicolon",
    ["P.Cons", ["P.VarId", charList("y")],
    ["P.Cons", "P.Equals",
    ["P.Cons", ["P.VarId", charList("x")],
    ["P.Cons", "P.RBrace",
    ["P.Cons", "P.In",
    ["P.Cons", ["P.VarId", charList("f")],
    ["P.Cons", ["P.VarId", charList("y")],
     "P.Nil"]]]]]]]]]]]]],
  ["P.LetExp",
    ["P.Cons",
      ["P.Binding",
        charList("x"),
        ["P.FExp", ["P.Cons", ["P.AInt", 3], "P.Nil"]]],
      ["P.Cons",
        ["P.Binding",
          charList("y"),
          ["P.FExp", ["P.Cons", ["P.AVar", charList("x")], "P.Nil"]]],
        "P.Nil"]],
    ["P.FExp",
      ["P.Cons", ["P.AVar", charList("f")],
      ["P.Cons", ["P.AVar", charList("y")],
       "P.Nil"]]]],
  "let exp 2"
);

assertParsedTokens(
  "P.exp",
  ["P.Cons", "P.Cased",
    ["P.Cons", ["P.VarId", charList("f")],
    ["P.Cons", ["P.VarId", charList("x")],
    ["P.Cons", "P.Of",
    ["P.Cons", "P.LBrace",
    ["P.Cons", ["P.ConId", charList("Cons")],
    ["P.Cons", ["P.VarId", charList("hd")],
    ["P.Cons", ["P.VarId", charList("tl")],
    ["P.Cons", "P.Arrow",
    ["P.Cons", ["P.IntLiteral", 1],
    ["P.Cons", "P.Semicolon",
    ["P.Cons", ["P.ConId", charList("Nil")],
    ["P.Cons", "P.Arrow",
    ["P.Cons", ["P.IntLiteral", 0],
    ["P.Cons", "P.RBrace",
     "P.Nil"]]]]]]]]]]]]]]],
  ["P.CasedExp",
    ["P.FExp",
      ["P.Cons", ["P.AVar", charList("f")],
      ["P.Cons", ["P.AVar", charList("x")],
       "P.Nil"]]],
    ["P.Cons",
      ["P.DAlt",
        charList("Cons"),
        ["P.Cons", charList("hd"), ["P.Cons", charList("tl"), "P.Nil"]],
        ["P.FExp", ["P.Cons", ["P.AInt", 1], "P.Nil"]]],
    ["P.Cons",
      ["P.DAlt",
        charList("Nil"),
        "P.Nil",
        ["P.FExp", ["P.Cons", ["P.AInt", 0], "P.Nil"]]],
      "P.Nil"]]],
  "cased exp"
);

assertParsedTokens(
  "P.exp",
  ["P.Cons", "P.Casei",
    ["P.Cons", ["P.VarId", charList("f")],
    ["P.Cons", ["P.VarId", charList("x")],
    ["P.Cons", "P.Of",
    ["P.Cons", "P.LBrace",
    ["P.Cons", ["P.IntLiteral", 3],
    ["P.Cons", "P.Arrow",
    ["P.Cons", ["P.IntLiteral", 1],
    ["P.Cons", "P.Semicolon",
    ["P.Cons", ["P.VarId", charList("foo")],
    ["P.Cons", "P.Arrow",
    ["P.Cons", ["P.IntLiteral", 0],
    ["P.Cons", "P.RBrace",
     "P.Nil"]]]]]]]]]]]]],
  ["P.CaseiExp",
    ["P.FExp",
      ["P.Cons", ["P.AVar", charList("f")],
      ["P.Cons", ["P.AVar", charList("x")],
       "P.Nil"]]],
    ["P.Cons",
      ["P.IAltInt",
        3,
        ["P.FExp", ["P.Cons", ["P.AInt", 1], "P.Nil"]]],
    ["P.Cons",
      ["P.IAltVar",
        charList("foo"),
        ["P.FExp", ["P.Cons", ["P.AInt", 0], "P.Nil"]]],
      "P.Nil"]]],
  "casei exp"
);

assertParsedTokens(
  "P.exp",
  ["P.Cons", "P.Casec",
    ["P.Cons", ["P.VarId", charList("f")],
    ["P.Cons", ["P.VarId", charList("x")],
    ["P.Cons", "P.Of",
    ["P.Cons", "P.LBrace",
    ["P.Cons", ["P.CharLiteral", {"str": "a"}],
    ["P.Cons", "P.Arrow",
    ["P.Cons", ["P.IntLiteral", 1],
    ["P.Cons", "P.Semicolon",
    ["P.Cons", ["P.VarId", charList("foo")],
    ["P.Cons", "P.Arrow",
    ["P.Cons", ["P.IntLiteral", 0],
    ["P.Cons", "P.RBrace",
     "P.Nil"]]]]]]]]]]]]],
  ["P.CasecExp",
    ["P.FExp",
      ["P.Cons", ["P.AVar", charList("f")],
      ["P.Cons", ["P.AVar", charList("x")],
       "P.Nil"]]],
    ["P.Cons",
      ["P.CAltChar",
        {"str": "a"},
        ["P.FExp", ["P.Cons", ["P.AInt", 1], "P.Nil"]]],
    ["P.Cons",
      ["P.CAltVar",
        charList("foo"),
        ["P.FExp", ["P.Cons", ["P.AInt", 0], "P.Nil"]]],
      "P.Nil"]]],
  "casec exp"
);

assertParsedTokens(
  "P.decl",
  ["P.Cons", "P.Data",
    ["P.Cons", ["P.ConId", charList("List")],
    ["P.Cons", "P.Equals",
    ["P.Cons", ["P.ConId", charList("Cons")],
    ["P.Cons", ["P.IntLiteral", 2],
    ["P.Cons", "P.Pipe",
    ["P.Cons", ["P.ConId", charList("Nil")],
    ["P.Cons", ["P.IntLiteral", 0],
     "P.Nil"]]]]]]]],
  ["P.DataDecl",
    charList("List"),
    ["P.Cons", ["P.ConDecl", charList("Cons"), 2],
    ["P.Cons", ["P.ConDecl", charList("Nil"), 0],
     "P.Nil"]]],
  "data decl"
);

assertParsedTokens(
  "P.decl",
  ["P.Cons", ["P.VarId", charList("const")],
    ["P.Cons", ["P.VarId", charList("first")],
    ["P.Cons", ["P.VarId", charList("second")],
    ["P.Cons", "P.Equals",
    ["P.Cons", ["P.VarId", charList("first")],
     "P.Nil"]]]]],
  ["P.FuncDecl",
    charList("const"),
    ["P.Cons", charList("first"),
    ["P.Cons", charList("second"),
     "P.Nil"]],
    ["P.FExp", ["P.Cons", ["P.AVar", charList("first")], "P.Nil"]]],
  "func decl"
);
