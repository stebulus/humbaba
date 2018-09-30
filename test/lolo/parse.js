var rt = require('../../humbaba-runtime');
var rts = require('../../humbaba-runtime-stream');
var t = require('tap');
var withLoloParse = require('../../test-lib/lolo_parse').withLoloParse;

function charList(s) {
  var list = "Nil";
  for (var i = s.length - 1; i > -1; i--)
    list = ["Cons", {"str": s.charAt(i)}, list];
  return list;
}

function assertParseResult(parser, input, expected, message) {
  var expectedValue = withLoloParse(expected);
  var actualValue = withLoloParse(["parseList", parser, input]);
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
  withLoloParse(["hex4", 13579]),
  'hex4 odd number'
);

t.strictSame(
  withLoloParse(charList("09A4")),
  withLoloParse(["hex4", 2468]),
  'hex4 even number'
);

assertParsed(["char", {"str": "x"}], "x", {"str": "x"}, 'parse char');
assertParseFail(["char", {"str": "x"}], "y", 'parse char fail');

assertParsed("optsign", "+", "True", 'parse sign plus');
assertParsed("optsign", "-", "False", 'parse sign minus');
assertParsed("optsign", "", "True", 'parse sign absent');

assertParsed("digit", "3", {"str": "3"}, 'parse digit');
assertParseFail("digit", "a", 'parse digit fail');

assertParsed(
  ["pMany", "digit"],
  "34",
  ["Cons", {"str": "3"}, ["Cons", {"str": "4"}, "Nil"]],
  "parse digit many"
);

assertParseFail(["pMany", "digit"], "!", "parse digit many fail");

assertParsed(
  ["pSome", "digit"],
  "34",
  ["Cons", {"str": "3"}, ["Cons", {"str": "4"}, "Nil"]],
  "parse digit some"
);

assertParsed(["pSome", "digit"], "", "Nil", "parse digit some Nil");

assertParsed("intLiteral", "5", ["IntLiteral", 5], "parse int literal");
assertParsed("intLiteral", "+5", ["IntLiteral", 5],
  "parse int literal signed");
assertParsed("intLiteral", "-5", ["IntLiteral", -5],
  "parse int literal negative");
assertParsed("intLiteral", "5732", ["IntLiteral", 5732],
  "parse int literal multidigit");

assertParsed("item", "b", {"str": "b"}, "parse any char");

assertParsed("charLiteral", "'b'", ["CharLiteral", {"str": "b"}],
  "parse char literal");

t.strictSame(
  withLoloParse(["digitToInt", {"str": "2"}]),
  new rt.Box(2),
  "digit to int"
);

t.strictSame(
  withLoloParse(["readInt",
    ["Cons", {"str": "3"},
    ["Cons", {"str": "7"},
    ["Cons", {"str": "4"}, "Nil"]]]]),
  new rt.Box(374),
  "digits to int"
);

t.strictSame(
  withLoloParse(["charLe", {"str": "a"}, {"str": "a"}]),
  rt.True,
  "a <= a"
);

t.strictSame(
  withLoloParse(["charLe", {"str": "a"}, {"str": "b"}]),
  rt.True,
  "a <= b"
);

t.strictSame(
  withLoloParse(["charLe", {"str": "b"}, {"str": "a"}]),
  rt.False,
  "not (b <= a)"
);

t.strictSame(
  withLoloParse(["charBetween", {"str": "a"}, {"str": "b"}, {"str": "c"}]),
  rt.False,
  "c is not between a & b"
);


t.strictSame(
  withLoloParse(["charBetween", {"str": "a"}, {"str": "c"}, {"str": "b"}]),
  rt.True,
  "b is between a & c"
);

assertParsed(
  "varidOrReserved",
  "xY",
  ["VarId", ["Cons", {"str": "x"}, ["Cons", {"str": "Y"}, "Nil"]]],
  "varid"
);

assertParsed("varidOrReserved", "let", "Let", "reserved");

assertParsed("token", "(", "LParen", "symbol");

assertParsed("comment", "#fnord\n", "Unit", "comment");

assertParsed(["ignoreSome", "whitestuff"], "  #fnord\n \n", "Unit",
  "whitestuff");

assertParsed(
  ["pMany", "tokenInWhitespace"],
  "  foo  #comment! \nbar",
  ["Cons", ["VarId", charList("foo")],
  ["Cons", ["VarId", charList("bar")],
    "Nil"]],
  "commentInStuff"
);

assertParsedTokens(
  "exp",
  ["Cons", "Let",
    ["Cons", "LBrace",
    ["Cons", ["VarId", charList("x")],
    ["Cons", "Equals",
    ["Cons", ["IntLiteral", 3],
    ["Cons", "RBrace",
    ["Cons", "In",
    ["Cons", ["VarId", charList("f")],
    ["Cons", ["VarId", charList("x")],
     "Nil"]]]]]]]]],
  ["LetExp",
    ["Cons",
      ["Binding",
        charList("x"),
        ["FExp", ["Cons", ["AInt", 3], "Nil"]]],
      "Nil"],
    ["FExp",
      ["Cons", ["AVar", charList("f")],
      ["Cons", ["AVar", charList("x")],
       "Nil"]]]],
  "let exp 1"
);

assertParsedTokens(
  "exp",
  ["Cons", "Let",
    ["Cons", "LBrace",
    ["Cons", ["VarId", charList("x")],
    ["Cons", "Equals",
    ["Cons", ["IntLiteral", 3],
    ["Cons", "Semicolon",
    ["Cons", ["VarId", charList("y")],
    ["Cons", "Equals",
    ["Cons", ["VarId", charList("x")],
    ["Cons", "RBrace",
    ["Cons", "In",
    ["Cons", ["VarId", charList("f")],
    ["Cons", ["VarId", charList("y")],
     "Nil"]]]]]]]]]]]]],
  ["LetExp",
    ["Cons",
      ["Binding",
        charList("x"),
        ["FExp", ["Cons", ["AInt", 3], "Nil"]]],
      ["Cons",
        ["Binding",
          charList("y"),
          ["FExp", ["Cons", ["AVar", charList("x")], "Nil"]]],
        "Nil"]],
    ["FExp",
      ["Cons", ["AVar", charList("f")],
      ["Cons", ["AVar", charList("y")],
       "Nil"]]]],
  "let exp 2"
);

assertParsedTokens(
  "exp",
  ["Cons", "Cased",
    ["Cons", ["VarId", charList("f")],
    ["Cons", ["VarId", charList("x")],
    ["Cons", "Of",
    ["Cons", "LBrace",
    ["Cons", ["ConId", charList("Cons")],
    ["Cons", ["VarId", charList("hd")],
    ["Cons", ["VarId", charList("tl")],
    ["Cons", "Arrow",
    ["Cons", ["IntLiteral", 1],
    ["Cons", "Semicolon",
    ["Cons", ["ConId", charList("Nil")],
    ["Cons", "Arrow",
    ["Cons", ["IntLiteral", 0],
    ["Cons", "RBrace",
     "Nil"]]]]]]]]]]]]]]],
  ["CasedExp",
    ["FExp",
      ["Cons", ["AVar", charList("f")],
      ["Cons", ["AVar", charList("x")],
       "Nil"]]],
    ["Cons",
      ["DAlt",
        charList("Cons"),
        ["Cons", charList("hd"), ["Cons", charList("tl"), "Nil"]],
        ["FExp", ["Cons", ["AInt", 1], "Nil"]]],
    ["Cons",
      ["DAlt",
        charList("Nil"),
        "Nil",
        ["FExp", ["Cons", ["AInt", 0], "Nil"]]],
      "Nil"]]],
  "cased exp"
);

assertParsedTokens(
  "exp",
  ["Cons", "Casei",
    ["Cons", ["VarId", charList("f")],
    ["Cons", ["VarId", charList("x")],
    ["Cons", "Of",
    ["Cons", "LBrace",
    ["Cons", ["IntLiteral", 3],
    ["Cons", "Arrow",
    ["Cons", ["IntLiteral", 1],
    ["Cons", "Semicolon",
    ["Cons", ["VarId", charList("foo")],
    ["Cons", "Arrow",
    ["Cons", ["IntLiteral", 0],
    ["Cons", "RBrace",
     "Nil"]]]]]]]]]]]]],
  ["CaseiExp",
    ["FExp",
      ["Cons", ["AVar", charList("f")],
      ["Cons", ["AVar", charList("x")],
       "Nil"]]],
    ["Cons",
      ["IAltInt",
        3,
        ["FExp", ["Cons", ["AInt", 1], "Nil"]]],
    ["Cons",
      ["IAltVar",
        charList("foo"),
        ["FExp", ["Cons", ["AInt", 0], "Nil"]]],
      "Nil"]]],
  "casei exp"
);

assertParsedTokens(
  "exp",
  ["Cons", "Casec",
    ["Cons", ["VarId", charList("f")],
    ["Cons", ["VarId", charList("x")],
    ["Cons", "Of",
    ["Cons", "LBrace",
    ["Cons", ["CharLiteral", {"str": "a"}],
    ["Cons", "Arrow",
    ["Cons", ["IntLiteral", 1],
    ["Cons", "Semicolon",
    ["Cons", ["VarId", charList("foo")],
    ["Cons", "Arrow",
    ["Cons", ["IntLiteral", 0],
    ["Cons", "RBrace",
     "Nil"]]]]]]]]]]]]],
  ["CasecExp",
    ["FExp",
      ["Cons", ["AVar", charList("f")],
      ["Cons", ["AVar", charList("x")],
       "Nil"]]],
    ["Cons",
      ["CAltChar",
        {"str": "a"},
        ["FExp", ["Cons", ["AInt", 1], "Nil"]]],
    ["Cons",
      ["CAltVar",
        charList("foo"),
        ["FExp", ["Cons", ["AInt", 0], "Nil"]]],
      "Nil"]]],
  "casec exp"
);

assertParsedTokens(
  "decl",
  ["Cons", "Data",
    ["Cons", ["ConId", charList("List")],
    ["Cons", "Equals",
    ["Cons", ["ConId", charList("Cons")],
    ["Cons", ["IntLiteral", 2],
    ["Cons", "Pipe",
    ["Cons", ["ConId", charList("Nil")],
    ["Cons", ["IntLiteral", 0],
     "Nil"]]]]]]]],
  ["DataDecl",
    charList("List"),
    ["Cons", ["ConDecl", charList("Cons"), 2],
    ["Cons", ["ConDecl", charList("Nil"), 0],
     "Nil"]]],
  "data decl"
);

assertParsedTokens(
  "decl",
  ["Cons", ["VarId", charList("const")],
    ["Cons", ["VarId", charList("first")],
    ["Cons", ["VarId", charList("second")],
    ["Cons", "Equals",
    ["Cons", ["VarId", charList("first")],
     "Nil"]]]]],
  ["FuncDecl",
    charList("const"),
    ["Cons", charList("first"),
    ["Cons", charList("second"),
     "Nil"]],
    ["FExp", ["Cons", ["AVar", charList("first")], "Nil"]]],
  "func decl"
);
