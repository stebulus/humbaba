/*
  Generate JavaScript from a Lolo AST.
*/
var util = require('util');

function weirdCode(astNode) {
  throw new Error('weird code: ' + util.inspect(astNode));
}

function expr(astNode, chunk, target) {
  switch (typeof astNode) {
    case 'boolean':
    case 'number':
      box(astNode, chunk, target);
      break;
    case 'string':
      useVar(astNode, chunk, target);
      break;
    case 'object':
      if (astNode === null) {
        box(astNode, chunk, target);
        break;
      } else if (Array.isArray(astNode)) {
        apply(astNode, chunk, target);
        break;
      } else if ('str' in astNode) {
        box(astNode.str, chunk, target);
        break;
      } else if ('let' in astNode) {
        letExpr(astNode, chunk, target);
        break;
      } else if ('casei' in astNode) {
        caseLiteral(astNode, 'casei', chunk, target);
        break;
      } else if ('casec' in astNode) {
        caseLiteral(astNode, 'casec', chunk, target);
        break;
      } else if ('cased' in astNode) {
        caseData(astNode, chunk, target);
        break;
      }
      // fall through!
    default:
      weirdCode(astNode);
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

function apply(astNode, chunk, target) {
  if (target) {
    chunk('rt.Apply.call(');
    chunk(target);
    chunk(', ');
  } else {
    chunk('new rt.Apply(');
  }
  expr(astNode[0], chunk, null);
  chunk(', [');
  for (var i = 1; i < astNode.length; i++) {
    if (i > 1) chunk(', ');
    expr(astNode[i], chunk, null);
  }
  chunk('])');
  if (target) chunk(';');
}

function letExpr(astNode, chunk, target) {
  chunk('(function () {');
  var bindings = astNode['let'];
  for (var i = 0; i < bindings.length; i++) {
    chunk('var $');
    chunk(bindings[i][0]);
    chunk(' = new rt.Empty();');
  }
  for (var i = 0; i < bindings.length; i++)
    expr(bindings[i][1], chunk, '$' + bindings[i][0]);
  if (target) {
    expr(astNode['in'], chunk, target);
  } else {
    chunk('return ');
    expr(astNode['in'], chunk, null);
    chunk(';');
  }
  chunk('})();');
}

function caseLiteral(astNode, exprKey, chunk, target) {
  if (target) {
    chunk('rt.Thunk.call(');
    chunk(target);
    chunk(', ');
  } else {
    chunk('new rt.Thunk(');
  }
  expr(astNode[exprKey], chunk, null);
  chunk(', function (x) {');
  chunk('switch (x.fields[0]) {');
  var alts = astNode['of'];
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
      chunk(alts[i][0].toString());
      chunk(': ');
    }
    expr(alts[i][1], chunk, 'this');
    chunk('break;');
  }
  chunk('};})');
  if (target) chunk(';');
}

function caseData(astNode, chunk, target) {
  if (target) {
    chunk('rt.Thunk.call(');
    chunk(target);
    chunk(', ');
  } else {
    chunk('new rt.Thunk(');
  }
  expr(astNode['cased'], chunk, null);
  chunk(', function (x) { switch (x.tag) {');
  var alts = astNode['of'];
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
  chunk('\ndefault: throw new Error("failure to match in cased: " + JSON.stringify(x) + ", in code: " + ' + JSON.stringify(JSON.stringify(astNode)) + ');');
  chunk('};})');
  if (target) chunk(';');
}

function program(ast, entry, chunk) {
  chunk('(function () {');
  chunk('function charEq(a, b) { rt.evaluate(a); a = rt.smashIndirects(a); rt.evaluate(b); b = rt.smashIndirects(b); var eq = a.fields[0] === b.fields[0] ? rt.True : rt.False; rt.Indirect.call(this, eq); }');
  chunk('var $charEq = new rt.Box(charEq);');
  chunk('function charOrd(a) { rt.evaluate(a); a = rt.smashIndirects(a); var ord = a.fields[0].charCodeAt(0); rt.Box.call(this, ord); }');
  chunk('var $charOrd = new rt.Box(charOrd);');
  chunk('function intAdd(a, b) { rt.evaluate(a); a = rt.smashIndirects(a); rt.evaluate(b); b = rt.smashIndirects(b); var sum = a.fields[0] + b.fields[0]; rt.Box.call(this, sum); }');
  chunk('var $intAdd = new rt.Box(intAdd);');
  chunk('function intMul(a, b) { rt.evaluate(a); a = rt.smashIndirects(a); rt.evaluate(b); b = rt.smashIndirects(b); var prod = a.fields[0] * b.fields[0]; rt.Box.call(this, prod); }');
  chunk('var $intMul = new rt.Box(intMul);');
  chunk('function intQuot(a, b) { rt.evaluate(a); a = rt.smashIndirects(a); rt.evaluate(b); b = rt.smashIndirects(b); var prod = Math.trunc(a.fields[0] / b.fields[0]); rt.Box.call(this, prod); }');
  chunk('var $intQuot = new rt.Box(intQuot);');
  chunk('function intRem(a, b) { rt.evaluate(a); a = rt.smashIndirects(a); rt.evaluate(b); b = rt.smashIndirects(b); var prod = a.fields[0] % b.fields[0]; rt.Box.call(this, prod); }');
  chunk('var $intRem = new rt.Box(intRem);');
  chunk('function intLe(a, b) { rt.evaluate(a); a = rt.smashIndirects(a); rt.evaluate(b); b = rt.smashIndirects(b); var cmp = a.fields[0] <= b.fields[0] ? rt.True : rt.False; rt.Indirect.call(this, cmp); }');
  chunk('var $intLe = new rt.Box(intLe);');
  var decls = ast['declarations'];
  for (var i = 0; i < decls.length; i++) {
    chunk('\n');
    if ('func' in decls[i]) {
      functionDeclaration(decls[i], chunk);
    } else if ('data' in decls[i]) {
      dataDeclaration(decls[i], chunk);
    } else {
      for (var k in decls[i]) {
        if (k !== 'comment' && k !== 'comments') {
          weirdCode(decls[i]);
        }
      }
    }
  }
  chunk('return $');
  chunk(entry);
  chunk(';})()');
}
exports.program = program;

function programToJavaScript(ast, entry) {
  var chunks = [];
  function chunk(text) { chunks.push(text); }
  program(ast, entry, chunk);
  return chunks.join('');
}
exports.programToJavaScript = programToJavaScript;

function functionDeclaration(astNode, chunk) {
  var lhs = astNode['func'];
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
  expr(astNode['='], chunk, 'this');
  chunk('}');
  if (lhs.length === 1) {
    // "function" with zero arguments; let name refer to thunk
    chunk('var $');
    chunk(name);
    chunk(' = new rt.Thunk(new rt.Data(1, []), func$');
    chunk(name);
    chunk(');');
  } else {
    // actual function; put it in a box
    chunk('var $');
    chunk(name);
    chunk(' = new rt.Box(func$');
    chunk(name);
    chunk(');');
  }
}

function dataDeclaration(astNode, chunk) {
  var alts = astNode['='];
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
