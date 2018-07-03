/*
  Compile Lolo JSON (on stdin) into JavaScript (on stdout).
*/
var commander = require('commander');
var fs = require('fs');
var process = require('process');

var codegen = require('./lolo_codegen');

function stdout(s) {
  process.stdout.write(s);
}

function addPrelude(ast) {
  ast['declarations'] = codegen.preludeLolo
    .concat(ast['declarations']);
}
exports.addPrelude = addPrelude;

function compile(ast, out, options) {
  out("var process = require('process');");
  out("var rt = require(");
  out(JSON.stringify(options.runtime));
  out(");");
  out("var rts = require(");
  out(JSON.stringify(options.runtimeStream));
  out(");");
  out(codegen.ioDeclsJavaScript);
  out("process.stdin.pipe(new rts.Stream(");
  codegen.program(ast, 'main', out);
  out(")).pipe(process.stdout);");
  // forget ref to stdin, so process exits when program finishes
  // despite theoretically waiting for data from stdin
  out("process.stdin.unref();");
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
    .option('--runtime <module>', 'use module as runtime (default humbaba/runtime)')
    .option('--runtime-stream <module>', 'use module as runtime-stream (default humbaba/runtime_stream)')
    .parse(process.argv);
  commander.output = commander.output || '-';
  var options =
    { runtime: commander.runtime || 'humbaba/runtime'
    , runtimeStream: commander.runtimeStream || 'humbaba/runtime_stream'
    };
  function doTheThing(input) {
    var ast = JSON.parse(input);
    addPrelude(ast);
    if (commander.output === '-') {
      compile(ast, writeTo(process.stdout), options);
    } else {
      strm = fs.createWriteStream(commander.output);
      compile(ast, writeTo(strm), options);
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
