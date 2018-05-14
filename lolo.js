var util = require('util');

function exprToExpr(code, chunk) {
  switch (typeof code) {
    case 'boolean':
    case 'number':
      box(code, chunk);
      break;
    case 'string':
      chunk('$' + code);
      break;
    case 'object':
      if (code === null) {
        box(code, chunk);
        break;
      } else if (Array.isArray(code)) {
        chunk('new rt.Apply(');
        applyArgs(code, chunk);
        chunk(')');
        break;
      } else if ('str' in code) {
        box(code.str, chunk);
        break;
      } else if ('let' in code) {
        withBindings(code['let'], function () {
          chunk('return ');
          exprToExpr(code['in'], chunk);
          chunk(';');
        }, chunk);
        break;
      } else if ('case' in code) {
        chunk('new rt.Thunk(');
        caseThunkArgs(code, chunk);
        chunk(')');
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
      boxOverwrite(code, target, chunk);
      break;
    case 'string':
      chunk('rt.Indirect.call(' + target + ', $' + code + ');');
      break;
    case 'object':
      if (code === null) {
        boxOverwrite(code, target, chunk);
        break;
      } else if (Array.isArray(code)) {
        chunk('rt.Apply.call(' + target + ', ');
        applyArgs(code, chunk);
        chunk(');');
        break;
      } else if ('str' in code) {
        boxOverwrite(code['str'], target, chunk);
        break;
      } else if ('let' in code) {
        withBindings(code['let'], function () {
          exprOverwrite(code['in'], target, chunk);
        }, chunk);
        break;
      } else if ('case' in code) {
        chunk('rt.Thunk.call(' + target + ', ');
        caseThunkArgs(code, chunk);
        chunk(');');
        break;
      }
      // fall through!
    default:
      throw new Error('weird code: ' + util.inspect(code));
  }
}
exports.exprOverwrite = exprOverwrite;

function box(value, chunk) {
  chunk('new rt.Box(');
  chunk(JSON.stringify(value));
  chunk(')');
}

function boxOverwrite(value, target, chunk) {
  chunk('rt.Box.call(');
  chunk(target);
  chunk(', ');
  chunk(JSON.stringify(value));
  chunk(');');
}

function applyArgs(applyExpr, chunk) {
  exprToExpr(applyExpr[0], chunk);
  chunk(', [');
  for (var i = 1; i < applyExpr.length; i++) {
    if (i > 1) chunk(', ');
    exprToExpr(applyExpr[i], chunk);
  }
  chunk(']');
}

function withBindings(bindings, f, chunk) {
  chunk('(function () {');
  for (var i = 0; i < bindings.length; i++)
    chunk('var $' + bindings[i][0] + ' = new rt.Empty();');
  for (var i = 0; i < bindings.length; i++)
    exprOverwrite(bindings[i][1], '$' + bindings[i][0], chunk);
  f();
  chunk('})();');
}

function caseThunkArgs(caseExpr, chunk) {
  exprToExpr(caseExpr['case'], chunk);
  chunk(', function (x) {');
  chunk('switch (x.$value) {');
  var alts = caseExpr['of'];
  for (var i = 0; i < alts.length; i++) {
    if (typeof alts[i][0] === 'string') {
      chunk('default: var $' + alts[i][0] + ' = x.$value;');
    } else {
      chunk('case ' + alts[i][0] + ': ');
    }
    exprOverwrite(alts[i][1], 'this', chunk);
    chunk('break;');
  }
  chunk('};}');
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
