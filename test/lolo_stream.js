var codegen = require('../lolo_codegen');
var rts = require('../runtime_stream');
var test = require('./lib/test');
var test_rts = require('./runtime_stream');

function stdout(input, program) {
  var code =
    "var rt = require('../runtime');" +
    codegen.ioDeclsJavaScript +
    codegen.programToJavaScript(program, 'test');
  var expr = eval(code);
  var strm = new rts.Stream(expr);
  if (input === null)
    strm.end();
  else
    strm.end(input);
  return strm;
}

function getOutput(input, program, callback) {
  test_rts.getOutputString(stdout(input, program), callback);
}
exports.getOutput = getOutput;

function expectOutput(expected, input, program, callback) {
  test_rts.expectOutputString(expected, stdout(input, program), callback);
}
exports.expectOutput = expectOutput;

tests = {

  nullProgram(callback) {
    expectOutput("", null, {"declarations": [
      {"func": ["test"], "=": ["ioPure", "Unit"]}
    ].concat(codegen.preludeLolo)}, callback);
  },

  emitOneChar(callback) {
    expectOutput("x", null, {"declarations": [
      {"func": ["test"], "=": ["putChar", {"str": "x"}]}
    ].concat(codegen.preludeLolo)}, callback);
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
    ].concat(codegen.preludeLolo)}, callback);
  },

  copyOneChar(callback) {
    expectOutput("x", "x", {"declarations": [
      {"func": ["test"], "=":
        ["ioBind", "getChar", "putChar"]}
    ].concat(codegen.preludeLolo)}, callback);
  },

};

exports.tests = tests;

if (require.main === module)
  test.main(tests);
