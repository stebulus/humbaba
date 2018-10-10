var rt = require('humbaba-runtime');

function evalAndUnbox(expr) {
  rt.evaluate(expr);
  expr = rt.smashIndirects(expr);
  return expr.fields[0];
}

function charAt(str, i) {
  rt.Box.call(this, evalAndUnbox(str).charAt(evalAndUnbox(i)));
}
exports.$charAt = new rt.Box(charAt);

function length(str) {
  rt.Box.call(this, evalAndUnbox(str).length);
}
exports.$length = new rt.Box(length);
