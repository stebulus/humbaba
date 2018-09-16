function wrapModuleFunc(moduleCodeString) {
  var pre = '(function (require, module, exports) {';
  var post = '})';
  return pre + moduleCodeString + post;
}
exports.wrapModuleFunc = wrapModuleFunc;

function makeRequire(lookupModuleFunc) {
  function require(moduleName) {
    var moduleFunc = lookupModuleFunc(moduleName);
    var requireWithBlackhole = makeRequire(function (name) {
      if (name == moduleName)
        throw new Error('circular require: ' + name);
      else
        return lookupModuleFunc(name);
    });
    var module = makeModule(requireWithBlackhole, moduleFunc);
    return module.exports;
  };
  return require;
}
exports.makeRequire = makeRequire;

function makeModule(require, moduleFunc) {
  var module = { exports: {} };
  moduleFunc(require, module, module.exports);
  return module;
}
exports.makeModule = makeModule;
