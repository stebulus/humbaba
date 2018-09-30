var cat = require('../../lib/cat-runtime.js');
var rt = require('../../../humbaba-runtime');
var rts = require('../../../humbaba-runtime-stream');
var t = require('tap');
var tp = require('../../lib/promise');
var ts = require('../../lib/stream');

var s = rts.Stream(
  new rt.Thunk(rt.True, function (x) {
    s.end('q');  // re-enter stream code as side effect of evaluation
    rt.Indirect.call(this, cat.program);
  })
);
tp.resolvesStrictSame(t,
  ts.output(s).then(ts.asString),
  'q',
  'stream is reentrant');
