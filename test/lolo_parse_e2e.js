var codegen = require('../lolo_codegen');
var test = require('./lib/test');
var test_llp = require('./lolo_parse');
var test_lls = require('./lolo_stream');

var lolo_parse = test_llp.withLoloParseProgram(["main"])
lolo_parse['declarations'] = codegen.preludeLolo
  .concat(lolo_parse['declarations']);

function expectParsed(expected, input, callback) {
  test_lls.getOutput(input, lolo_parse, function (output) {
    test.assertSame(expected, JSON.parse(output), callback);
    callback(null);
  });
}

tests = {

  mainDecl(callback) {
    expectParsed(
      {"declarations": [
        {"func": ["main"], "=": ["putChar", {"str": "x"}]}
      ]},
      "{ main = putChar 'x' }",
      callback
    );
  },

  dataDecl(callback) {
    expectParsed(
      {"declarations": [
        {"data": "List", "=": [["Cons", 2], ["Nil", 0]]}
      ]},
      "{ data List = Cons 2 | Nil 0 }",
      callback
    );
  },

  funcWithCased(callback) {
    expectParsed(
      {"declarations": [
        {"func": ["main"], "=":
          {"cased": "x", "of": [["True", "Unit"], ["False", "Unit"]]}}
      ]},
      "{ main = cased x of { True > Unit ; False > Unit } }",
      callback
    );
  },

};

exports.tests = tests;

if (require.main === module)
  test.main(tests);
