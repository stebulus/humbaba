var rt = require('../../../humbaba-runtime');
var t = require('tap');

function identity(x) {
  rt.Indirect.call(this, x);
}
var boxedIdentity = new rt.Box(identity);

function devaluate(x) {
  return new rt.Apply(boxedIdentity, [x]);
}

var dataWithFields = new rt.Box(1);
var e = devaluate(new rt.Data(0,
  [devaluate(rt.True), devaluate(dataWithFields)]));
rt.evaluateDeep(e);
e = rt.smashIndirects(e);
t.strictSame(e, new rt.Data(0, [rt.True, dataWithFields]),
  'all fields evaluated');

function constant(x, y) {
  rt.Indirect.call(this, x);
}
var boxedConst = new rt.Box(constant);

t.doesNotThrow(function () {
  var bomb = new rt.Apply(
    new rt.Box(function (x) {
      throw new Error("this function should not be called");
    }),
    [rt.True]
  );
  rt.evaluateDeep(new rt.Apply(boxedConst, [bomb]));
}, 'arguments of PAPs are not evaluated');
