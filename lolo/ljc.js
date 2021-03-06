/*
  Compile Lolo JSON (on stdin) into JavaScript (on stdout).
*/
var commander = require('commander');
var fs = require('fs');
var process = require('process');

var codegen = require('./codegen');

function stdout(s) {
  process.stdout.write(s);
}

var startCode =
  "var process = require('process');" +
  "var rts = require('humbaba-runtime-stream');" +
  "new rts.Stream($main, process.stdin).pipe(process.stdout);"

function compile(ast, main, out) {
  codegen.module(ast, out);
  if (main) out(startCode);
}
exports.compile = compile;

function writeTo(strm) {
  return function write(chunk) {
    strm.write(chunk);
  }
}

if (require.main === module) {
  commander.version('0.1.0')
    .usage('[options] [file]')
    .option('-o, --output <file>', 'write to file (default stdout)')
    .option('-m, --main', 'emit startup code')
    .parse(process.argv);
  commander.output = commander.output || '-';
  function doTheThing(input) {
    var ast = JSON.parse(input);
    if (commander.output === '-') {
      compile(ast, commander.main, writeTo(process.stdout));
    } else {
      strm = fs.createWriteStream(commander.output);
      compile(ast, commander.main, writeTo(strm));
      strm.end();
    }
  }
  switch (commander.args.length) {
    case 0:
      var chunks = [];
      process.stdin
      .on('data', function (chunk) { chunks.push(chunk); })
      .on('end', function () { doTheThing(chunks.join('')); });
      break;
    case 1:
      fs.readFile(commander.args[0], function (err, data) {
        if (err) throw err;
        doTheThing(data);
      });
      break;
    default:
      throw new Error('too many input files specified: ' + JSON.stringify(commander.args));
  }
}
