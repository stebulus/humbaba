var lolo = require('./lolo');
var rts = require('./runtime_stream');
var test = require('./test');
var test_rts = require('./test_runtime_stream');

function expectOutput(expected, input, program, callback) {
  var code =
    "var rt = require('./runtime');" +
    lolo.ioDeclsJavaScript +
    lolo.programToJavaScript(program, 'test');
  var expr = eval(code);
  var strm = new rts.Stream(expr);
  if (input === null)
    strm.end();
  else
    strm.end(input);
  test_rts.expectOutputString(expected, strm, callback);
}
exports.expectOutput = expectOutput;

tests = {

  nullProgram(callback) {
    expectOutput("", null, {"declarations": [
      {"func": ["test"], "=": ["ioPure", "Unit"]}
    ].concat(lolo.preludeLolo)}, callback);
  },

  emitOneChar(callback) {
    expectOutput("x", null, {"declarations": [
      {"func": ["test"], "=": ["putChar", {"str": "x"}]}
    ].concat(lolo.preludeLolo)}, callback);
  },

  emitSeveralChars(callback) {
    expectOutput("xyz", null, {"declarations": [
      {"func": ["const", "x", "y"], "=": "x"},
      {"func": ["ioThen", "ioa", "iob"], "=":
        ["ioBind", "ioa", ["const", "iob"]]},
      {"func": ["test"], "=":
        ["ioThen", ["putChar", {"str": "x"}],
        ["ioThen", ["putChar", {"str": "y"}],
                   ["putChar", {"str": "z"}]]]}
    ].concat(lolo.preludeLolo)}, callback);
  },

  copyOneChar(callback) {
    expectOutput("x", "x", {"declarations": [
      {"func": ["test"], "=":
        ["ioBind", "getChar", "putChar"]}
    ].concat(lolo.preludeLolo)}, callback);
  },

};

exports.tests = tests;

if (require.main === module)
  test.main(tests);
