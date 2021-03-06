var rt = require('humbaba-runtime');

function intAdd(a, b) {
  rt.evaluate(a);
  a = rt.smashIndirects(a);
  rt.evaluate(b);
  b = rt.smashIndirects(b);
  var sum = a.fields[0] + b.fields[0];
  rt.Box.call(this, sum);
}
exports.$add = new rt.Box(intAdd);

function intMul(a, b) {
  rt.evaluate(a);
  a = rt.smashIndirects(a);
  rt.evaluate(b);
  b = rt.smashIndirects(b);
  var prod = a.fields[0] * b.fields[0];
  rt.Box.call(this, prod);
}
exports.$mul = new rt.Box(intMul);

function intQuot(a, b) {
  rt.evaluate(a);
  a = rt.smashIndirects(a);
  rt.evaluate(b);
  b = rt.smashIndirects(b);
  var prod = Math.trunc(a.fields[0] / b.fields[0]);
  rt.Box.call(this, prod);
}
exports.$quot = new rt.Box(intQuot);

function intRem(a, b) {
  rt.evaluate(a);
  a = rt.smashIndirects(a);
  rt.evaluate(b);
  b = rt.smashIndirects(b);
  var prod = a.fields[0] % b.fields[0];
  rt.Box.call(this, prod);
}
exports.$rem = new rt.Box(intRem);

function intLe(a, b) {
  rt.evaluate(a);
  a = rt.smashIndirects(a);
  rt.evaluate(b);
  b = rt.smashIndirects(b);
  var cmp = a.fields[0] <= b.fields[0] ? rt.True : rt.False;
  rt.Indirect.call(this, cmp);
}
exports.$le = new rt.Box(intLe);

function intOr(a, b) {
  rt.evaluate(a);
  a = rt.smashIndirects(a);
  rt.evaluate(b);
  b = rt.smashIndirects(b);
  var or = a.fields[0] | b.fields[0];
  rt.Box.call(this, or)
}
exports.$or = new rt.Box(intOr);

function intAnd(a, b) {
  rt.evaluate(a);
  a = rt.smashIndirects(a);
  rt.evaluate(b);
  b = rt.smashIndirects(b);
  var and = a.fields[0] & b.fields[0];
  rt.Box.call(this, and)
}
exports.$and = new rt.Box(intAnd);

function intShiftl(a, b) {
  rt.evaluate(a);
  a = rt.smashIndirects(a);
  rt.evaluate(b);
  b = rt.smashIndirects(b);
  var shift = a.fields[0] << b.fields[0];
  rt.Box.call(this, shift)
}
exports.$shiftl = new rt.Box(intShiftl);
