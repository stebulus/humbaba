/*
  Generate JavaScript from a Lolo AST.
*/
var util = require('util');

function weirdCode(astNode) {
  throw new Error('weird code: ' + util.inspect(astNode));
}

function expr(astNode, chunk, target) {
  switch (typeof astNode) {
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

function exprCode(astNode, target) {
  var s = '';
  function chunk(text) { s += text; }
  expr(astNode, chunk, target);
  return s;
}
exports.exprCode = exprCode;

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
    chunk(', ');
    varName(name, chunk);
    chunk(');');
  } else {
    varName(name, chunk);
  }
}

function varName(name, chunk) {
  var parts = name.split('.');
  if (parts.length > 1) {
    chunk(modName(parts.slice(0, -1)));
    chunk('.');
  }
  chunk('$');
  chunk(parts[parts.length-1]);
}

function modName(parts) {
  return 'mod$' + parts.join('$');
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
  if (target)
    chunk('(function (target) {');
  else
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
    expr(astNode['in'], chunk, 'target');
    chunk('}).call(this, ');
    chunk(target);
    chunk(');');
  } else {
    chunk('return ');
    expr(astNode['in'], chunk, null);
    chunk(';');
    chunk('}).call(this);');
  }
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

function module(ast, chunk) {
  chunk("var rt = require('humbaba-runtime');\n");
  var decls = ast['declarations'];
  for (var i = 0; i < decls.length; i++) {
    chunk('\n');
    if ('func' in decls[i]) {
      functionDeclaration(decls[i], chunk);
    } else if ('data' in decls[i]) {
      dataDeclaration(decls[i], chunk);
    } else if ('import' in decls[i]) {
      importModule(decls[i]['import'], chunk);
    } else {
      for (var k in decls[i]) {
        if (k !== 'comment' && k !== 'comments') {
          weirdCode(decls[i]);
        }
      }
    }
  }
}
exports.module = module;

function moduleToJavaScript(ast) {
  var chunks = [];
  function chunk(text) { chunks.push(text); }
  module(ast, chunk);
  return chunks.join('');
}
exports.moduleToJavaScript = moduleToJavaScript;

function exportName(name, chunk) {
  chunk('exports.');
  chunk(name);
  chunk(' = ');
  chunk(name);
  chunk(';');
}

function functionDeclaration(astNode, chunk) {
  var lhs = astNode['func'];
  var name = lhs[0];
  var funcName = 'func$' + name;
  chunk('function ');
  chunk(funcName);
  chunk('(');
  for (var i = 1; i < lhs.length; i++) {
    if (i > 1) chunk(', ');
    chunk('$');
    chunk(lhs[i]);
  }
  chunk(') {');
  expr(astNode['='], chunk, 'this');
  chunk('}');
  var varName = '$' + name;
  if (lhs.length === 1) {
    // "function" with zero arguments; let name refer to thunk
    chunk('var ');
    chunk(varName);
    chunk(' = new rt.Thunk(new rt.Data(1, []), ');
    chunk(funcName);
    chunk(');');
  } else {
    // actual function; put it in a box
    chunk('var ');
    chunk(varName);
    chunk(' = new rt.Box(');
    chunk(funcName);
    chunk(');');
  }
  exportName(varName, chunk);
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
  var tagName = 'tag$' + name;
  chunk('var ');
  chunk(tagName);
  chunk(' = ');
  chunk(value.toString());
  chunk(';');
  exportName(tagName, chunk);
}

function declareUnboxedConstructor(name, arity, chunk) {
  var dataName = 'data$' + name;
  chunk('function ');
  chunk(dataName);
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
  chunk(dataName);
  chunk('.prototype = rt.Node;');
  exportName(dataName, chunk);
}

function declareSingleton(name, chunk) {
  var varName = '$' + name;
  chunk('var ');
  chunk(varName);
  chunk(' = ');
  chunk('new data$');
  chunk(name);
  chunk('();');
  exportName(varName, chunk);
}

function declareBoxedConstructor(name, chunk) {
  var varName = '$' + name;
  chunk(varName);
  chunk(' = new rt.Box(data$');
  chunk(name);
  chunk(');');
  exportName(varName, chunk);
}

function importModule(name, chunk) {
  var nameParts = name.split('.');
  chunk('var ');
  chunk(modName(nameParts));
  chunk(' = require(');
  chunk(JSON.stringify(nameParts.join('/')));
  chunk(');\n');
}
