var util = require('util');

function exprToExpr(code, chunk) {
  switch (typeof code) {
    case 'boolean':
    case 'number':
      chunk(box(code));
      break;
    case 'string':
      chunk('$' + code);
      break;
    case 'object':
      if (code === null) {
        chunk(box(code));
        break;
      } else if ('str' in code) {
        chunk(box(code.str));
        break;
      } else if ('let' in code) {
        chunk('(function () {');
        const bindings = code['let']
        for (var i = 0; i < bindings.length; i++)
          chunk('var $' + bindings[i][0] + ' = new rt.Empty();');
        for (var i = 0; i < bindings.length; i++)
          exprOverwrite(bindings[i][1], '$' + bindings[i][0], chunk);
        chunk('return ');
        exprToExpr(code['in'], chunk);
        chunk(';');
        chunk('})()');
        break;
      }
      // fall through!
    default:
      throw new Error('weird code: ' + util.inspect(code));
  }
}

function exprOverwrite(code, target, chunk) {
  switch (typeof code) {
    case 'boolean':
    case 'number':
      chunk(boxOverwrite(code, target));
      break;
    case 'string':
      chunk('rt.Indirect.call(' + target + ', $' + code + ');');
      break;
    case 'object':
      if (code === null) {
        chunk(boxOverwrite(code, target));
        break;
      } else if ('str' in code) {
        chunk(boxOverwrite(code['str'], target));
        break;
      } else if ('let' in code) {
        chunk('(function () {');
        const bindings = code['let']
        for (var i = 0; i < bindings.length; i++)
          chunk('var $' + bindings[i][0] + ' = new rt.Empty();');
        for (var i = 0; i < bindings.length; i++)
          exprOverwrite(bindings[i][1], '$' + bindings[i][0], chunk);
        exprOverwrite(code['in'], target, chunk);
        chunk('})();');
        break;
      }
      // fall through!
    default:
      throw new Error('weird code: ' + util.inspect(code));
  }
}

function box(value) {
  return 'new rt.Box(' + JSON.stringify(value) + ')';
}

function boxOverwrite(value, target) {
  return 'rt.Box.call(' + target + ', ' + JSON.stringify(value) + ');';
}

module.exports.exprToExpr = exprToExpr;
module.exports.exprOverwrite = exprOverwrite;
