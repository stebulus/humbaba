var rt = require('../humbaba-runtime');
var rts = require('../humbaba-runtime-stream');
var stream = require('stream');
var t = require('tap');
var ts = require('./lib/stream');

ts.outputChunks(
  new rts.Stream(new rt.IoPure(rt.Unit)),
  [],
  'null program'
);

ts.outputChunks(
  new rts.Stream(
    new rt.IoPure(rt.Unit),
    new stream.Readable({
      read() { throw new Error('stdin was unexpectedly read'); }
    })
  ),
  [],
  'null program with stdin'
);

ts.outputChunks(
  new rts.Stream(new rt.PutChar(new rt.Box('x'))),
  ['x'],
  'emit one char'
);

ts.outputChunks(
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
  ['x', 'y', 'z'],
  'emit several chars'
);

ts.outputChunks(
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
  ['x'],
  'copy one char (writing)'
);

ts.outputChunks(
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
  ['x'],
  'copy one char (piping)'
);
