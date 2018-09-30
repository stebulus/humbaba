var rt = require('../../../humbaba-runtime');
var t = require('tap');

function EvaluateAndReturn(node) {
  rt.Thunk.call(this, node,
    function (node) { rt.Indirect.call(this, node); });
}

function loop(n) {
  var root = new rt.Empty();
  var last = root;
  for (var i = 1; i < n; i++) {
    last = new EvaluateAndReturn(last);
  }
  EvaluateAndReturn.call(root, last);
  return root;
}

for (var size = 1; size <= 5; size++) {
  t.throws(function () { rt.evaluate(loop(size)); },
    /infinite loop/,
    'loop of ' + size + ' thunks causes an exception');
}
