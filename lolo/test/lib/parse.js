var evaluate = require('./evaluate');
var fs = require('fs');
var path = require('path');

var llparse = (function () {
  var here = path.dirname(module.filename)
  var llparseSource = path.join(here, '..', '..', 'parse.lj');
  return JSON.parse(fs.readFileSync(llparseSource));
})();

function withLoloParseProgram(expr) {
  return {"declarations": llparse['declarations'].concat([
    {"func": ["test"], "=": expr}
  ])};
}
exports.withLoloParseProgram = withLoloParseProgram;

function withLoloParse(expr) {
  return evaluate.program(withLoloParseProgram(expr));
}

exports.withLoloParse = withLoloParse;
