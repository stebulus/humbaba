var process = require('process');
var promise = require('../../test-lib/promise');
var rt = require('../../humbaba-runtime');
var rts = require('../../humbaba-runtime-stream');
var stream = require('stream');
var t = require('tap');
var ts = require('../../test-lib/stream');

function copyOneChar() {
  return new rt.IoBind(
    rt.GetChar,
    new rt.Box(function (char) {
      rt.PutChar.call(this, char);
    })
  );
}

promise.resolvesStrictSame(t,
  ts.output((function () {
    var stream = new rts.Stream(copyOneChar());
    stream.end('x');
    return stream;
  })()),
  ['x'],
  'copy one char (writing)'
);

promise.resolvesStrictSame(t,
  ts.output(new rts.Stream(
    copyOneChar(),
    new stream.Readable({
      read() {
        this.push('x');
        this.destroy();
      }
    })
  )),
  ['x'],
  'copy one char (piping)'
);

function copyOneCharWithInput(chunks) {
  var s = new rts.Stream(copyOneChar());
  var blackhole = new stream.Writable({
    write(chunk, encoding, callback) { callback(); }
  });
  s.pipe(blackhole);
  s.on('error', function (err) {} );
  function write(chunk) {
    return function (x) {
      return new Promise(function (resolve, reject) {
        process.nextTick(function () {
          s.write(chunk, function (err) {
            if (err) reject(err); else resolve(true);
          });
        });
      });
    }
  }
  return function (x) {
    var promise = Promise.resolve(true);
    for (var i = 0; i < chunks.length; i++)
      promise = promise.then(write(chunks[i]));
    return promise;
  };
}

t.resolves(copyOneCharWithInput(['x']), 'can write one-char chunk');
t.rejects(copyOneCharWithInput(['xy']), { message: /ended/ },
  "can't write two-char chunk");
t.rejects(copyOneCharWithInput(['x', 'y']), { message: /ended/ },
  "can't write two chars");
