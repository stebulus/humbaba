var codegen = require('../lolo_codegen');
var mod = require('../module');
var primmod = require('./lib/prim_modules');
var rts = require('../humbaba-runtime-stream');
var rt = require('../humbaba-runtime');
var test = require('./lib/test');
var test_rts = require('./runtime_stream');

function stdout(input, program) {
  var moduleCodeString = codegen.moduleToJavaScript(program);
  var moduleFunc = eval(mod.wrapModuleFunc(moduleCodeString));
  var module = mod.makeModule(primmod.require, moduleFunc);
  var strm = new rts.Stream(module.exports.$test);
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
      {"import": "Prim.IO"},
      {"import": "Prim.Unit"},
      {"func": ["test"], "=": ["Prim.IO.pure", "Prim.Unit.Unit"]}
    ]}, callback);
  },

  emitOneChar(callback) {
    expectOutput("x", null, {"declarations": [
      {"import": "Prim.IO"},
      {"func": ["test"], "=": ["Prim.IO.putChar", {"str": "x"}]}
    ]}, callback);
  },

  emitSeveralChars(callback) {
    expectOutput("xyz", null, {"declarations": [
      {"import": "Prim.IO"},
      {"func": ["const", "x", "y"], "=": "x"},
      {"func": ["ioThen", "ioa", "iob"], "=":
        ["Prim.IO.bind", "ioa", ["const", "iob"]]},
      {"func": ["test"], "=":
        ["ioThen", ["Prim.IO.putChar", {"str": "x"}],
        ["ioThen", ["Prim.IO.putChar", {"str": "y"}],
                   ["Prim.IO.putChar", {"str": "z"}]]]}
    ]}, callback);
  },

  copyOneChar(callback) {
    expectOutput("x", "x", {"declarations": [
      {"import": "Prim.IO"},
      {"func": ["test"], "=":
        ["Prim.IO.bind", "Prim.IO.getChar", "Prim.IO.putChar"]}
    ]}, callback);
  },

};

exports.tests = tests;

if (require.main === module)
  test.main(tests);
