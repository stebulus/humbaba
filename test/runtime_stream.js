var rt = require('../humbaba-runtime');
var rts = require('../humbaba-runtime-stream');
var stream = require('stream');
var t = require('tap');
var ts = require('./lib/stream');

ts.output(
  new rts.Stream(new rt.IoPure(rt.Unit)),
  ts.asChunks,
  [],
  'null program'
);

ts.output(
  new rts.Stream(
    new rt.IoPure(rt.Unit),
    new stream.Readable({
      read() { throw new Error('stdin was unexpectedly read'); }
    })
  ),
  ts.asChunks,
  [],
  'null program with stdin'
);

ts.output(
  new rts.Stream(new rt.PutChar(new rt.Box('x'))),
  ts.asChunks,
  ['x'],
  'emit one char'
);

ts.output(
  new rts.Stream(
    new rt.IoBind(
      new rt.PutChar(new rt.Box('x')),
      new rt.Box(function (_unit) {
        rt.IoBind.call(this,
          new rt.PutChar(new rt.Box('y')),
          new rt.Box(function (_unit) {
            rt.PutChar.call(this, new rt.Box('z'));
          })
        );
      })
    )
  ),
  ts.asChunks,
  ['x', 'y', 'z'],
  'emit several chars'
);

ts.output(
  (function () {
    var stream = new rts.Stream(
      new rt.IoBind(
        rt.GetChar,
        new rt.Box(function (char) {
          rt.PutChar.call(this, char);
        })
      )
    );
    stream.end('x');
    return stream;
  })(),
  ts.asChunks,
  ['x'],
  'copy one char (writing)'
);

ts.output(
  new rts.Stream(
    new rt.IoBind(
      rt.GetChar,
      new rt.Box(function (char) {
        rt.PutChar.call(this, char);
      })
    ),
    new stream.Readable({
      read() {
        this.push('x');
        this.destroy();
      }
    })
  ),
  ts.asChunks,
  ['x'],
  'copy one char (piping)'
);
