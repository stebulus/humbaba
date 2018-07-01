/*
  Lolo -> JavaScript compiler
*/
var fs = require('fs');
var process = require('process');

var lolo = require('./lolo');

function err(s) {
  process.stderr.write(s);
}

function out(s) {
  process.stdout.write(s);
}

if (require.main === module) {
  if (process.argv.length != 3) {
    err('usage: ');
    err(process.argv0);
    err(' ');
    err(process.argv[1]);
    err(' FILENAME\n');
    process.exit(1);
  }
  var code = JSON.parse(fs.readFileSync(process.argv[2]));
  for (var i = 0; i < lolo.preludeLolo.length; i++)
    code['declarations'].push(lolo.preludeLolo[i]);
  out("var process = require('process');");
  out("var rt = require('./runtime');");
  out("var rts = require('./runtime_stream');");
  out(lolo.ioDeclsJavaScript);
  out("process.stdin.pipe(new rts.Stream(");
  lolo.program(code, 'main', out);
  out(")).pipe(process.stdout);");
  // forget ref to stdin, so process exits when program finishes
  // despite theoretically waiting for data from stdin
  out("process.stdin.unref();");
}
