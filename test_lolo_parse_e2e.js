var lolo = require('./lolo');
var test = require('./test');
var test_llp = require('./test_lolo_parse');
var test_lls = require('./test_lolo_stream');

var lolo_parse = test_llp.withLoloParseProgram(["main"])
lolo_parse['declarations'] = lolo.preludeLolo
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

};

exports.tests = tests;

if (require.main === module)
  test.main(tests);