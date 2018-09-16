var llmod = require('../lolo_module');

var test = require('./lib/test');

tests = {

  assignMemberOfExports() {
    var moduleCodeString = "exports.three = 3;"
    var moduleFunc = eval(llmod.wrapModuleFunc(moduleCodeString));
    function lookupModule(name) {
      throw new Error("attempted lookup of module " + name);
    }
    var require = llmod.makeRequire(lookupModule);
    var module = llmod.makeModule(require, moduleFunc);
    test.assertSame(3, module.exports.three);
  },

  assignToExports() {
    var moduleCodeString = "module.exports = 3;"
    var moduleFunc = eval(llmod.wrapModuleFunc(moduleCodeString));
    function lookupModule(name) {
      throw new Error("attempted lookup of module " + name);
    }
    var require = llmod.makeRequire(lookupModule);
    var module = llmod.makeModule(require, moduleFunc);
    test.assertSame(3, module.exports);
  },

  reexport() {
    var importeeCodeString = "exports.foo = 3;";
    var importeeModuleFunc = eval(llmod.wrapModuleFunc(importeeCodeString));
    var noRequire = llmod.makeRequire(function (name) {
      throw new Error("attempted lookup of module " + name);
    });
    var importee = llmod.makeModule(noRequire, importeeModuleFunc);
    var importerCodeString = "exports.bar = require('importee').foo;";
    var importerModuleFunc = eval(llmod.wrapModuleFunc(importerCodeString));
    var requireImportee = llmod.makeRequire(function (name) {
      if (name === 'importee')
        return importeeModuleFunc;
      else
        throw new Error("attempted lookup of module " + name);
    });
    var importer = llmod.makeModule(requireImportee, importerModuleFunc);
    test.assertSame(3, importer.exports.bar);
  },

  circularRequire() {
    var moduleFuncs = {
      one: eval(llmod.wrapModuleFunc("exports.foo = require('two').bar;")),
      two: eval(llmod.wrapModuleFunc("exports.bar = require('one').foo;")),
    }
    var require = llmod.makeRequire(function (name) {
      var moduleFunc = moduleFuncs[name];
      if (typeof moduleFunc === 'undefined')
        throw new Error('no module named ' + name);
      return moduleFunc;
    });
    var message;
    try {
      llmod.makeModule(require, moduleFuncs.one);
      message = 'no exception';
    } catch (e) {
      message = e.message;
    }
    if (!message.includes('circular require'))
      throw new Error("message doesn't mention circular require: " + message)
  },

}

exports.tests = tests;

if (require.main === module)
  test.main(tests);
