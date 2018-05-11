var util = require('util');

function exprToExpr(code, chunk) {
  switch (typeof code) {
    case 'boolean':
    case 'number':
      chunk(box(code));
      break;
    case 'object':
      if (code === null) {
        chunk(box(code));
        break;
      } else if ('str' in code) {
        chunk(box(code.str));
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

module.exports.exprToExpr = exprToExpr;
