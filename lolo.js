/*
  Lolo -> Javascript

  Lolo is a very low-level functional programming language whose syntax
  is JSON.  This module contains facilities to generate JavaScript
  code for Lolo programs.  See ljc.js for the simplest use.
*/
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
      } else if ('casei' in code) {
        caseLiteral(code, 'casei', chunk, target);
        break;
      } else if ('casec' in code) {
        caseLiteral(code, 'casec', chunk, target);
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

function caseLiteral(code, exprKey, chunk, target) {
  if (target) {
    chunk('rt.Thunk.call(');
    chunk(target);
    chunk(', ');
  } else {
    chunk('new rt.Thunk(');
  }
  expr(code[exprKey], chunk, null);
  chunk(', function (x) {');
  chunk('switch (x.fields[0]) {');
  var alts = code['of'];
  for (var i = 0; i < alts.length; i++) {
    if (typeof alts[i][0] === 'string') {
      chunk('\ndefault: var $');
      chunk(alts[i][0]);
      chunk(' = new rt.Box(x.fields[0]);');
    } else if (typeof alts[i][0] === 'object') {
      if ('str' in alts[i][0]) {
        chunk('\ncase ');
        chunk(JSON.stringify(alts[i][0]['str']));
        chunk(': ');
      } else {
        weirdCode(alts[i][0]);
      }
    } else {
      chunk('\ncase ');
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
    chunk('\ncase ');
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
  chunk('\ndefault: throw new Error("failure to match in cased: " + JSON.stringify(x) + ", in code: " + ' + JSON.stringify(JSON.stringify(code)) + ');');
  chunk('};})');
  if (target) chunk(';');
}

function program(program, entry, chunk) {
  chunk('(function () {');
  chunk('function charEq(a, b) { rt.evaluate(a); a = rt.smashIndirects(a); rt.evaluate(b); b = rt.smashIndirects(b); var eq = a.fields[0] === b.fields[0] ? rt.True : rt.False; rt.Indirect.call(this, eq); }');
  chunk('var $charEq = new rt.Box(charEq);');
  chunk('function charOrd(a) { rt.evaluate(a); a = rt.smashIndirects(a); var ord = a.fields[0].charCodeAt(0); rt.Box.call(this, ord); }');
  chunk('var $charOrd = new rt.Box(charOrd);');
  chunk('function intAdd(a, b) { rt.evaluate(a); a = rt.smashIndirects(a); rt.evaluate(b); b = rt.smashIndirects(b); var sum = a.fields[0] + b.fields[0]; rt.Box.call(this, sum); }');
  chunk('var $intAdd = new rt.Box(intAdd);');
  chunk('function intMul(a, b) { rt.evaluate(a); a = rt.smashIndirects(a); rt.evaluate(b); b = rt.smashIndirects(b); var prod = a.fields[0] * b.fields[0]; rt.Box.call(this, prod); }');
  chunk('var $intMul = new rt.Box(intMul);');
  chunk('function intLe(a, b) { rt.evaluate(a); a = rt.smashIndirects(a); rt.evaluate(b); b = rt.smashIndirects(b); var cmp = a.fields[0] <= b.fields[0] ? rt.True : rt.False; rt.Indirect.call(this, cmp); }');
  chunk('var $intLe = new rt.Box(intLe);');
  var decls = program['declarations'];
  for (var i = 0; i < decls.length; i++) {
    chunk('\n');
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
  chunk(', []);})()');
}
exports.program = program;

function programToJavaScript(prog, entry) {
  var chunks = [];
  function chunk(text) { chunks.push(text); }
  program(prog, entry, chunk);
  return chunks.join('');
}
exports.programToJavaScript = programToJavaScript;

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

exports.ioDeclsJavaScript =
  'var $ioPure = new rt.Box(rt.IoPure);' +
  'var $ioBind = new rt.Box(rt.IoBind);' +
  'var $getChar = rt.GetChar;' +
  'var $putChar = new rt.Box(rt.PutChar);' +
  'var $isEOF = rt.IsEOF;';

exports.preludeLolo = [
  {"data": "Bool", "=": [["True"], ["False"]]},
  {"data": "Unit", "=": [["Unit"]]},
];
