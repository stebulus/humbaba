var codegen = require('../../../codegen');
var mod = require('../../../module');
var primmod = require('./prim-modules');
var rt = require('humbaba-runtime/humbaba-runtime');

function expr(astNode) {
  var e = eval(codegen.exprCode(astNode));
  rt.evaluate(e);
  return rt.smashIndirects(e);
}
exports.expr = expr;

function exprOver(astNode) {
  var s = '(function () { var o = new rt.Empty(); '
    + codegen.exprCode(astNode, 'o')
    + 'return o; })()';
  var e = eval(s);
  rt.evaluate(e);
  return rt.smashIndirects(e);
}
exports.exprOver = exprOver;

function program(ast) {
  var moduleCode = codegen.moduleToJavaScript(ast);
  var moduleFunc = eval(mod.wrapModuleFunc(moduleCode));
  var module = mod.makeModule(primmod.require, moduleFunc);
  var e = module.exports.$test;
  rt.evaluateDeep(e);
  return rt.smashIndirects(e);
}
exports.program = program;
