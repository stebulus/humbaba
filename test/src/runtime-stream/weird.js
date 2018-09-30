var rt = require('../../../humbaba-runtime');
var rts = require('../../../humbaba-runtime-stream');
var t = require('tap');

var s = new rts.Stream(new rt.IoBind(new rt.Data(-3, []),
  function (x) { throw new Error("not expected to reach here"); }))
t.throws(function () { return s.read(); }, { message: /weird/ },
  'unexpected tag values cause an exception');
