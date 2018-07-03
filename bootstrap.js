var fs = require('fs');
var spawn = require('child_process').spawn;

function run(command, args, callback) {
  function done(err) {
    if (callback) process.nextTick(callback, err);
    callback = null;
  }
  console.log(command + ' ' + args.join(' '));
  spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  .on('error', done)
  .on('exit', function (code, signal) {
    if (code === 0)
      done(null);
    else if (code !== null)
      done(new Error('child exited with code ' + code));
    else
      done(new Error('child stopped by signal ' + signal));
  });
}

function ljc(input, output, callback) {
  run('node',
    ['ljc.js',
     '-o', output,
     '--runtime', './runtime',
     '--runtime-stream', './runtime_stream',
     input
    ],
    callback);
}

function bootstrap(callback) {
  ljc('lolo_parse.lj', 'lolo_parse.js', callback);
}
exports.bootstrap = bootstrap;

if (require.main === module) {
  bootstrap(function (err) { if (err) throw err; });
}
