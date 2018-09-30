var rt = require('../../../humbaba-runtime');
var rts = require('../../../humbaba-runtime-stream');
var t = require('tap');

// a program that stalls immediately, making writes "block"
var s = new rts.Stream(new rt.PutChar('y'));

function notExpectedToComplete(err) {
  throw new Error('write unexpectedly completed, with error ' + err);
}

t.test("first write doesn't complete",
  function (t) {
    s._write('a', null, notExpectedToComplete);
    process.nextTick(function () { t.end(); });
  });

t.throws(function () {
  s._write('b', null, notExpectedToComplete);
}, { message: /write\(\) was called again/ }, 'second write throws');
