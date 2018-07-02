var fs = require('fs');
var path = require('path');

var rt = require('./runtime');
var rts = require('./runtime_stream');
var test = require('./test');
var test_lolo = require('./test_lolo');

var llparse = (function () {
  var here = path.dirname(module.filename)
  var llparseSource = path.join(here, 'lolo_parse.lj');
  return JSON.parse(fs.readFileSync(llparseSource));
})();

function charList(s) {
  var list = "Nil";
  for (var i = s.length - 1; i > -1; i--)
    list = ["Cons", {"str": s.charAt(i)}, list];
  return list;
}

function withLoloParseProgram(expr) {
  return {"declarations": llparse['declarations'].concat([
    {"func": ["test"], "=": expr}
  ])};
}
exports.withLoloParseProgram = withLoloParseProgram;

function withLoloParse(expr) {
  return test_lolo.programValue(withLoloParseProgram(expr));
}

function assertParseResult(expected, parser, input) {
  var expectedValue = withLoloParse(expected);
  var actualValue = withLoloParse(["parseList", parser, input]);
  test.assertSame(expectedValue, actualValue);
}

function assertParsed(expected, parser, input) {
  assertParseResult(["Right", expected], parser, charList(input));
}

function assertParsedTokens(expected, parser, input) {
  assertParseResult(["Right", expected], parser, input);
}

function assertParseFail(parser, input) {
  assertParseResult(["Left", {"str": "f"}], parser, charList(input));
}

tests = {

  charOrd() {
    test.assertSame(new rt.Box(97),
      withLoloParse(["charOrd", {"str": "a"}]));
  },

  parseChar() {
    assertParsed({"str": "x"}, ["char", {"str": "x"}], "x");
  },

  parseCharFail() {
    assertParseFail(["char", {"str": "x"}], "y");
  },

  parseSignPlus() {
    assertParsed("True", ["optsign"], "+");
  },

  parseSignMinus() {
    assertParsed("False", ["optsign"], "-");
  },

  parseSignAbsent() {
    assertParsed("True", ["optsign"], "");
  },

  parseDigit() {
    assertParsed({"str": "3"}, ["digit"], "3");
  },

  parseDigitFail() {
    assertParseFail(["digit"], "a");
  },

  parseDigitMany() {
    assertParsed(
      ["Cons", {"str": "3"}, ["Cons", {"str": "4"}, "Nil"]],
      ["pMany", ["digit"]],
      "34");
  },

  parseDigitManyFail() {
    assertParseFail(["pMany", ["digit"]], "!");
  },

  parseDigitSome() {
    assertParsed(
      ["Cons", {"str": "3"}, ["Cons", {"str": "4"}, "Nil"]],
      ["pSome", ["digit"]],
      "34");
  },

  parseDigitSomeNil() {
    assertParsed("Nil", ["pSome", ["digit"]], "");
  },

  parseIntLiteral() {
    assertParsed(["IntLiteral", 5], ["intLiteral"], "5");
  },

  parseIntLiteralSigned() {
    assertParsed(["IntLiteral", 5], ["intLiteral"], "+5");
  },

  parseIntLiteralNegative() {
    assertParsed(["IntLiteral", -5], ["intLiteral"], "-5");
  },

  parseIntLiteralMultidigit() {
    assertParsed(["IntLiteral", 5732], ["intLiteral"], "5732");
  },

  parseAnyChar() {
    assertParsed({"str": "b"}, ["item"], "b");
  },

  parseCharLiteral() {
    assertParsed(["CharLiteral", {"str": "b"}], ["charLiteral"], "'b'");
  },

  digit2int() {
    test.assertSame(new rt.Box(2),
      withLoloParse(["digit2int", {"str": "2"}]));
  },

  digits2int() {
    test.assertSame(new rt.Box(374),
      withLoloParse(["digits2int",
        ["Cons", {"str": "3"},
        ["Cons", {"str": "7"},
        ["Cons", {"str": "4"}, "Nil"]]]]));
  },

  charLeAA() {
    test.assertSame(rt.True,
      withLoloParse(["charLe", {"str": "a"}, {"str": "a"}]));
  },

  charLeAB() {
    test.assertSame(rt.True,
      withLoloParse(["charLe", {"str": "a"}, {"str": "b"}]));
  },

  charLeBA() {
    test.assertSame(rt.False,
      withLoloParse(["charLe", {"str": "b"}, {"str": "a"}]));
  },

  charBetweenABC() {
    test.assertSame(rt.False,
      withLoloParse(["charBetween", {"str": "a"}, {"str": "b"}, {"str": "c"}]));
  },

  charBetweenACB() {
    test.assertSame(rt.True,
      withLoloParse(["charBetween", {"str": "a"}, {"str": "c"}, {"str": "b"}]));
  },

  varid() {
    assertParsed(
      ["VarId", ["Cons", {"str": "x"}, ["Cons", {"str": "Y"}, "Nil"]]],
      ["varidOrReserved"],
      "xY");
  },

  reserved() {
    assertParsed("Let", ["varidOrReserved"], "let");
  },

  symbol() {
    assertParsed("LParen", ["token"], "(");
  },

  letExp1() {
    var bindings = ["Cons",
      ["Binding",
        charList("x"),
        ["FExp", ["Cons", ["AInt", 3], "Nil"]]],
      "Nil"];
    var exp = ["FExp",
      ["Cons", ["AVar", charList("f")],
      ["Cons", ["AVar", charList("x")],
       "Nil"]]];
    assertParsedTokens(["LetExp", bindings, exp],
      ["exp"],
      ["Cons", "Let",
      ["Cons", "LBrace",
      ["Cons", ["VarId", charList("x")],
      ["Cons", "Equals",
      ["Cons", ["IntLiteral", 3],
      ["Cons", "RBrace",
      ["Cons", "In",
      ["Cons", ["VarId", charList("f")],
      ["Cons", ["VarId", charList("x")],
       "Nil"]]]]]]]]]);
  },

  letExp2() {
    var bindings =
      ["Cons", ["Binding",
        charList("x"),
        ["FExp", ["Cons", ["AInt", 3], "Nil"]]],
      ["Cons", ["Binding",
        charList("y"),
        ["FExp", ["Cons", ["AVar", charList("x")], "Nil"]]],
      "Nil"]];
    var exp = ["FExp",
      ["Cons", ["AVar", charList("f")],
      ["Cons", ["AVar", charList("y")],
       "Nil"]]];
    assertParsedTokens(["LetExp", bindings, exp],
      ["exp"],
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
       "Nil"]]]]]]]]]]]]]);
  },

  casedExp() {
    assertParsedTokens(
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
      ["exp"],
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
       "Nil"]]]]]]]]]]]]]]]
    );
  },

  caseiExp() {
    assertParsedTokens(
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
      ["exp"],
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
       "Nil"]]]]]]]]]]]]]
    );
  },

  casecExp() {
    assertParsedTokens(
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
      ["exp"],
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
       "Nil"]]]]]]]]]]]]]
    );
  },

  dataDecl() {
    assertParsedTokens(
      ["DataDecl",
        charList("List"),
        ["Cons", ["ConDecl", charList("Cons"), 2],
        ["Cons", ["ConDecl", charList("Nil"), 0],
         "Nil"]]],
      ["decl"],
      ["Cons", "Data",
      ["Cons", ["ConId", charList("List")],
      ["Cons", "Equals",
      ["Cons", ["ConId", charList("Cons")],
      ["Cons", ["IntLiteral", 2],
      ["Cons", "Pipe",
      ["Cons", ["ConId", charList("Nil")],
      ["Cons", ["IntLiteral", 0],
       "Nil"]]]]]]]]
    );
  },

  funcDecl() {
    assertParsedTokens(
      ["FuncDecl",
        charList("const"),
        ["Cons", charList("first"),
        ["Cons", charList("second"),
         "Nil"]],
        ["FExp", ["Cons", ["AVar", charList("first")], "Nil"]]],
      ["decl"],
      ["Cons", ["VarId", charList("const")],
      ["Cons", ["VarId", charList("first")],
      ["Cons", ["VarId", charList("second")],
      ["Cons", "Equals",
      ["Cons", ["VarId", charList("first")],
       "Nil"]]]]]
    );
  },

}

exports.tests = tests;

if (require.main === module)
  test.main(tests);
