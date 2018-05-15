var util = require('util');

function weirdCode(code) {
  throw new Error('weird code: ' + util.inspect(code));
}

function expr(code, chunk, target) {
  switch (typeof code) {
    case 'boolean':
    case 'number':
      box(code, chunk, target);
      break;
    case 'string':
      useVar(code, chunk, target);
      break;
    case 'object':
      if (code === null) {
        box(code, chunk, target);
        break;
      } else if (Array.isArray(code)) {
        apply(code, chunk, target);
        break;
      } else if ('str' in code) {
        box(code.str, chunk, target);
        break;
      } else if ('let' in code) {
        letExpr(code, chunk, target);
        break;
      } else if ('casel' in code) {
        caseLiteral(code, chunk, target);
        break;
      }
      // fall through!
    default:
      weirdCode(code);
  }
}
exports.expr = expr;

function box(value, chunk, target) {
  if (target) {
    chunk('rt.Box.call(');
    chunk(target);
    chunk(', ');
    chunk(JSON.stringify(value));
    chunk(');');
  } else {
    chunk('new rt.Box(');
    chunk(JSON.stringify(value));
    chunk(')');
  }
}

function useVar(name, chunk, target) {
  if (target) {
    chunk('rt.Indirect.call(');
    chunk(target);
    chunk(', $');
    chunk(name);
    chunk(');');
  } else {
    chunk('$')
    chunk(name);
  }
}

function apply(applyExpr, chunk, target) {
  if (target) {
    chunk('rt.Apply.call(');
    chunk(target);
    chunk(', ');
  } else {
    chunk('new rt.Apply(');
  }
  expr(applyExpr[0], chunk, null);
  chunk(', [');
  for (var i = 1; i < applyExpr.length; i++) {
    if (i > 1) chunk(', ');
    expr(applyExpr[i], chunk, null);
  }
  chunk('])');
  if (target) chunk(';');
}

function letExpr(code, chunk, target) {
  chunk('(function () {');
  var bindings = code['let'];
  for (var i = 0; i < bindings.length; i++) {
    chunk('var $');
    chunk(bindings[i][0]);
    chunk(' = new rt.Empty();');
  }
  for (var i = 0; i < bindings.length; i++)
    expr(bindings[i][1], chunk, '$' + bindings[i][0]);
  if (target) {
    expr(code['in'], chunk, target);
  } else {
    chunk('return ');
    expr(code['in'], chunk, null);
    chunk(';');
  }
  chunk('})();');
}

function caseLiteral(code, chunk, target) {
  if (target) {
    chunk('rt.Thunk.call(');
    chunk(target);
    chunk(', ');
  } else {
    chunk('new rt.Thunk(');
  }
  expr(code['casel'], chunk, null);
  chunk(', function (x) {');
  chunk('switch (x.$value) {');
  var alts = code['of'];
  for (var i = 0; i < alts.length; i++) {
    if (typeof alts[i][0] === 'string') {
      chunk('default: var $');
      chunk(alts[i][0]);
      chunk(' = new rt.Box(x.$value);');
    } else if (typeof alts[i][0] === 'object') {
      if ('str' in alts[i][0]) {
        chunk('case ');
        chunk(JSON.stringify(alts[i][0]['str']));
        chunk(': ');
      } else {
        weirdCode(alts[i][0]);
      }
    } else {
      chunk('case ');
      chunk(alts[i][0]);
      chunk(': ');
    }
    expr(alts[i][1], chunk, 'this');
    chunk('break;');
  }
  chunk('};})');
  if (target) chunk(';');
}

function program(program, entry, chunk) {
  chunk('(function () {');
  var decls = program['declarations'];
  for (var i = 0; i < decls.length; i++) {
    if ('func' in decls[i]) {
      var lhs = decls[i]['func'];
      chunk('function func$');
      chunk(lhs[0]);
      chunk('(');
      for (var j = 1; j < lhs.length; j++) {
        if (j > 1) chunk(', ');
        chunk('$');
        chunk(lhs[j]);
      }
      chunk(') {');
      expr(decls[i]['='], chunk, 'this');
      chunk('}');
      chunk('var $');
      chunk(lhs[0]);
      chunk(' = new rt.Box(func$');
      chunk(lhs[0]);
      chunk(');');
    } else {
      weirdCode(code);
    }
  }
  chunk('return new rt.Apply($');
  chunk(entry);
  chunk(', []);})();');
}
exports.program = program;
