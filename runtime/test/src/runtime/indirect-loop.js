var rt = require('../../../humbaba-runtime');
var t = require('tap');

function loop(n) {
  var root = new rt.Empty();
  var last = root;
  for (var i = 1; i < n; i++)
    last = new rt.Indirect(last);
  rt.Indirect.call(root, last);
  return root;
}

for (var size = 1; size <= 5; size++) {
  t.throws(function () { rt.evaluate(loop(size)); },
    /infinite loop/,
    'loop of ' + size + ' indirects causes an exception');
}
