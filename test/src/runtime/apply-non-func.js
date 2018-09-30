var rt = require('../../../humbaba-runtime');
var t = require('tap');

function identity(x) {
  rt.Indirect.call(this, x);
}

// (id id) True
var x = new rt.Apply(new rt.Apply(identity, identity), rt.True)

/*
  rt.evaluate(x) ensures that x.evaluand is evaluated before being
  given to x.continuation; we circumvent that to check error detection.
*/
t.throws(function () {
  x.continuation(x.evaluand);
}, /non-function/, "throw when an Apply's function isn't one");
