var promise = require('../../test-lib/promise');
var rt = require('../../humbaba-runtime');
var rts = require('../../humbaba-runtime-stream');
var stream = require('stream');
var t = require('tap');
var ts = require('../../test-lib/stream');

promise.resolvesStrictSame(t,
  ts.output(new rts.Stream(new rt.PutChar(new rt.Box('x')))),
  ['x'],
  'emit one char'
);

promise.resolvesStrictSame(t,
  ts.output(new rts.Stream(
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
  )),
  ['x', 'y', 'z'],
  'emit several chars'
);
