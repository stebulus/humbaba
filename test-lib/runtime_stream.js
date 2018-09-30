var codegen = require('../lolo_codegen');
var mod = require('../module');
var primmod = require('./prim_modules');
var rts = require('../humbaba-runtime-stream');

function stdout(program, input) {
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
exports.stdout = stdout;
