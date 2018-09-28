var mod = require('../module');
var t = require('tap');

(function () {
  var moduleCodeString = "exports.three = 3;"
  var moduleFunc = eval(mod.wrapModuleFunc(moduleCodeString));
  function lookupModule(name) {
    throw new Error("attempted lookup of module " + name);
  }
  var require = mod.makeRequire(lookupModule);
  var module = mod.makeModule(require, moduleFunc);
  t.strictSame(module.exports.three, 3, 'assign member of exports');
})();

(function () {
  var moduleCodeString = "module.exports = 3;"
  var moduleFunc = eval(mod.wrapModuleFunc(moduleCodeString));
  function lookupModule(name) {
    throw new Error("attempted lookup of module " + name);
  }
  var require = mod.makeRequire(lookupModule);
  var module = mod.makeModule(require, moduleFunc);
  t.strictSame(module.exports, 3, 'assign to exports');
})();

(function () {
  var importeeCodeString = "exports.foo = 3;";
  var importeeModuleFunc = eval(mod.wrapModuleFunc(importeeCodeString));
  var noRequire = mod.makeRequire(function (name) {
    throw new Error("attempted lookup of module " + name);
  });
  var importee = mod.makeModule(noRequire, importeeModuleFunc);
  var importerCodeString = "exports.bar = require('importee').foo;";
  var importerModuleFunc = eval(mod.wrapModuleFunc(importerCodeString));
  var requireImportee = mod.makeRequire(function (name) {
    if (name === 'importee')
      return importeeModuleFunc;
    else
      throw new Error("attempted lookup of module " + name);
  });
  var importer = mod.makeModule(requireImportee, importerModuleFunc);
  t.strictSame(importer.exports.bar, 3, 're-export');
})();

(function () {
  var moduleFuncs = {
    one: eval(mod.wrapModuleFunc("exports.foo = require('two').bar;")),
    two: eval(mod.wrapModuleFunc("exports.bar = require('one').foo;")),
  }
  var require = mod.makeRequire(function (name) {
    var moduleFunc = moduleFuncs[name];
    if (typeof moduleFunc === 'undefined')
      throw new Error('no module named ' + name);
    return moduleFunc;
  });
  t.throws(
    function () { mod.makeModule(require, moduleFuncs.one); },
    {'message': /circular require/},
    'circular require'
  );
})();
