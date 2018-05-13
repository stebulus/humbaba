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
      } else if (Array.isArray(code)) {
        chunk('new rt.Apply(');
        exprToExpr(code[0], chunk);
        chunk(', [');
        for (var i = 1; i < code.length; i++) {
          if (i > 1) chunk(', ');
          exprToExpr(code[i], chunk);
        }
        chunk('])');
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
exports.exprToExpr = exprToExpr;

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
      } else if (Array.isArray(code)) {
        chunk('rt.Apply.call(' + target + ', ');
        exprToExpr(code[0], chunk);
        chunk(', [');
        for (var i = 1; i < code.length; i++) {
          if (i > 1) chunk(', ');
          exprToExpr(code[i], chunk);
        }
        chunk('])');
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
exports.exprOverwrite = exprOverwrite;

function box(value) {
  return 'new rt.Box(' + JSON.stringify(value) + ')';
}

function boxOverwrite(value, target) {
  return 'rt.Box.call(' + target + ', ' + JSON.stringify(value) + ');';
}

function program(program, entry, chunk) {
  chunk('(function () {');
  var decls = program['declarations'];
  for (var i = 0; i < decls.length; i++) {
    if ('func' in decls[i]) {
      var lhs = decls[i]['func'];
      chunk('function func$' + lhs[0] + '(');
      for (var j = 1; j < lhs.length; j++) {
        if (j > 1) chunk(', ');
        chunk('$' + lhs[j]);
      }
      chunk(') {');
      exprOverwrite(decls[i]['='], 'this', chunk);
      chunk('}');
      chunk('var $' + lhs[0] + ' = new rt.Box(func$' + lhs[0] + ');');
    } else {
      throw new Error('weird code: ' + util.inspect(code));
    }
  }
  chunk('return new rt.Apply($' + entry + ', []);');
  chunk('})();');
}
exports.program = program;
