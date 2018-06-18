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
      } else if ('cased' in code) {
        caseData(code, chunk, target);
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
  chunk('switch (x.fields[0]) {');
  var alts = code['of'];
  for (var i = 0; i < alts.length; i++) {
    if (typeof alts[i][0] === 'string') {
      chunk('default: var $');
      chunk(alts[i][0]);
      chunk(' = new rt.Box(x.fields[0]);');
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

function caseData(code, chunk, target) {
  if (target) {
    chunk('rt.Thunk.call(');
    chunk(target);
    chunk(', ');
  } else {
    chunk('new rt.Thunk(');
  }
  expr(code['cased'], chunk, null);
  chunk(', function (x) { switch (x.tag) {');
  var alts = code['of'];
  for (var i = 0; i < alts.length; i++) {
    var con = alts[i][0];
    var args = alts[i].slice(1, -1);
    var rhs = alts[i][alts[i].length-1];
    chunk('case ');
    chunk('tag$');
    chunk(con);
    chunk(': ');
    for (var j = 0; j < args.length; j++) {
      chunk('var $');
      chunk(args[j]);
      chunk(' = x.fields[');
      chunk(j.toString());
      chunk('];');
    }
    expr(rhs, chunk, 'this');
    chunk('break;');
  }
  chunk('default: throw new Error("failure to match in cased: " + x.tag);');
  chunk('};})');
  if (target) chunk(';');
}

function program(program, entry, chunk) {
  chunk('(function () {');
  var decls = program['declarations'];
  for (var i = 0; i < decls.length; i++) {
    if ('func' in decls[i]) {
      functionDeclaration(decls[i], chunk);
    } else if ('data' in decls[i]) {
      dataDeclaration(decls[i], chunk);
    } else {
      weirdCode(decls[i]);
    }
  }
  chunk('return new rt.Apply($');
  chunk(entry);
  chunk(', []);})();');
}
exports.program = program;

function functionDeclaration(decl, chunk) {
  var lhs = decl['func'];
  var name = lhs[0];
  chunk('function func$');
  chunk(name);
  chunk('(');
  for (var i = 1; i < lhs.length; i++) {
    if (i > 1) chunk(', ');
    chunk('$');
    chunk(lhs[i]);
  }
  chunk(') {');
  expr(decl['='], chunk, 'this');
  chunk('}');
  chunk('var $');
  chunk(name);
  chunk(' = new rt.Box(func$');
  chunk(name);
  chunk(');');
}

function dataDeclaration(decl, chunk) {
  var alts = decl['='];
  for (var i = 0; i < alts.length; i++) {
    var name = alts[i][0];
    var arity = alts[i][1];
    declareTag(name, i+1, chunk);
    declareUnboxedConstructor(name, arity, chunk);
    if (arity === 0)
      declareSingleton(name, chunk);
    else
      declareBoxedConstructor(name, chunk);
  }
}

function declareTag(name, value, chunk) {
  chunk('var tag$');
  chunk(name);
  chunk(' = ');
  chunk(value.toString());
  chunk(';');
}

function declareUnboxedConstructor(name, arity, chunk) {
  chunk('function data$');
  chunk(name);
  chunk('(');
  for (var i = 0; i < arity; i++) {
    if (i > 0) chunk(', ');
    chunk('x');
    chunk(i.toString());
  }
  chunk('){');
  chunk('rt.Data.call(this, tag$');
  chunk(name);
  chunk(', [');
  for (var i = 0; i < arity; i++) {
    if (i > 0) chunk(', ');
    chunk('x');
    chunk(i.toString());
  }
  chunk(']);');
  chunk('}');
  chunk('data$');
  chunk(name);
  chunk('.prototype = rt.Node;');
}

function declareSingleton(name, chunk) {
  chunk('var $');
  chunk(name);
  chunk(' = ');
  chunk('new data$');
  chunk(name);
  chunk('();');
}

function declareBoxedConstructor(name, chunk) {
  chunk('var $');
  chunk(name);
  chunk(' = new rt.Box(data$');
  chunk(name);
  chunk(');');
}
