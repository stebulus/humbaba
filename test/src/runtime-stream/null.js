var promise = require('../../lib/promise');
var rt = require('../../../humbaba-runtime');
var rts = require('../../../humbaba-runtime-stream');
var stream = require('stream');
var t = require('tap');
var ts = require('../../lib/stream');

function nullProgram() {
  return new rt.IoPure(rt.Unit);
}

promise.resolvesStrictSame(t,
  ts.output(new rts.Stream(nullProgram())),
  [],
  'null program'
);

promise.resolvesStrictSame(t,
  ts.output(new rts.Stream(
    nullProgram(),
    new stream.Readable({
      read() { throw new Error('stdin was unexpectedly read'); }
    })
  )),
  [],
  'null program with stdin'
);
