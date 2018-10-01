var fs = require('fs');
var path = require('path');

var mod = require('../../module');
var rt = require('../../../runtime/humbaba-runtime');

var here = path.dirname(module.filename);

function makeRuntime(require, module, exports) {
  module.exports = rt;
};

function lookupModuleFunc(name) {
  if (name === 'humbaba-runtime') {
    return makeRuntime;
  } else if (name.startsWith('Prim/') || name.startsWith('Lolo/')) {
    var source = path.join(here, '..', '..', name + '.js');
    var code = fs.readFileSync(source);
    return eval(mod.wrapModuleFunc(code));
  } else {
    throw new Error('unknown module: ' + name);
  }
}
exports.require = mod.makeRequire(lookupModuleFunc);
