var rt = require('humbaba-runtime');

function charEq(a, b) {
  rt.evaluate(a);
  a = rt.smashIndirects(a);
  rt.evaluate(b);
  b = rt.smashIndirects(b);
  var eq = a.fields[0] === b.fields[0] ? rt.True : rt.False;
  rt.Indirect.call(this, eq);
}
exports.$eq = new rt.Box(charEq);

function charOrd(a) {
  rt.evaluate(a);
  a = rt.smashIndirects(a);
  var ord = a.fields[0].charCodeAt(0);
  rt.Box.call(this, ord);
}
exports.$ord = new rt.Box(charOrd);
