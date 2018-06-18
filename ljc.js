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

var PRELUDE_JS =
  'var $ioPure = new rt.Box(rt.IoPure);' +
  'var $ioBind = new rt.Box(rt.IoBind);' +
  'var $getChar = rt.GetChar;' +
  'var $putChar = new rt.Box(rt.PutChar);' +
  'var $isEOF = rt.IsEOF;';
var PRELUDE_LOLO = [
  {"data": "Bool", "=": [["True"], ["False"]]},
  {"data": "Unit", "=": [["Unit"]]},
];

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
  for (var i = 0; i < PRELUDE_LOLO.length; i++)
    code['declarations'].push(PRELUDE_LOLO[i]);
  out("var process = require('process');");
  out("var rt = require('./runtime');");
  out("var rts = require('./runtime_stream');");
  out(PRELUDE_JS);
  out("process.stdin.pipe(new rts.Stream(");
  lolo.program(code, 'main', out);
  out(")).pipe(process.stdout);");
}
