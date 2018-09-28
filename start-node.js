var process = require('process');
var rt = require('humbaba-runtime');
var rts = require('humbaba-runtime-stream');
var main = require(process.argv[2]);
rts.Stream(main.$main, process.stdin).pipe(process.stdout);
