var fs = require('fs');
var spawn = require('child_process').spawn;

function run(command, args, stdout, callback) {
  function done(err) {
    if (callback) process.nextTick(callback, err);
    callback = null;
  }
  function actuallyRun(actualStdout, stdoutDescription) {
    console.log(command + ' ' + args.join(' ')
      + (stdoutDescription ? ' ' + stdoutDescription : ''));
    spawn(command, args, { stdio: ['ignore', actualStdout, 'inherit'] })
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
  if (stdout === null) {
    actuallyRun('inherit', null);
  } else {
    fs.open(stdout, 'w', function (err, fd) {
      try {
        if (err)
          done(err)
        else
          actuallyRun(fd, '>' + stdout);
      } finally {
        fs.close(fd, function (err) {
          if (err) console.warn('error closing file: ' + err);
        });
      }
    });
  }
}

function ljc(input, output, callback) {
  run('node', ['ljc.js', input], output, callback);
}

function bootstrap(callback) {
  ljc('lolo_parse.lj', 'lolo_parse.js', callback);
}
exports.bootstrap = bootstrap;

if (require.main === module) {
  bootstrap(function (err) { if (err) throw err; });
}
