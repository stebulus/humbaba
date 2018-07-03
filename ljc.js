/*
  Compile Lolo JSON (on stdin) into JavaScript (on stdout).
*/
var fs = require('fs');
var process = require('process');

var codegen = require('./lolo_codegen');

function err(s) {
  process.stderr.write(s);
}

function out(s) {
  process.stdout.write(s);
}

function addPrelude(ast) {
  ast['declarations'] = codegen.preludeLolo
    .concat(ast['declarations']);
}
exports.addPrelude = addPrelude;

function compile(ast, out) {
  out("var process = require('process');");
  out("var rt = require('humbaba/runtime');");
  out("var rts = require('humbaba/runtime_stream');");
  out(codegen.ioDeclsJavaScript);
  out("process.stdin.pipe(new rts.Stream(");
  codegen.program(ast, 'main', out);
  out(")).pipe(process.stdout);");
  // forget ref to stdin, so process exits when program finishes
  // despite theoretically waiting for data from stdin
  out("process.stdin.unref();");
}
exports.compile = compile;

if (require.main === module) {
  if (process.argv.length != 3) {
    err('usage: ');
    err(process.argv0);
    err(' ');
    err(process.argv[1]);
    err(' FILENAME\n');
    process.exit(1);
  }
  var ast = JSON.parse(fs.readFileSync(process.argv[2]));
  addPrelude(ast);
  compile(ast, out);
}
