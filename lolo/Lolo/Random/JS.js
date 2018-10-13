var crypto = require('crypto');
var rt = require('humbaba-runtime');
var tuple = require('Data/Tuple');

function evalAndUnbox(expr) {
  rt.evaluate(expr);
  expr = rt.smashIndirects(expr);
  return expr.fields[0];
}

// encrypt :: Block -> Block -> Block
function encrypt(key, block) {
  var cipher = crypto.createCipher('aes-128-ecb', evalAndUnbox(key));
  rt.Box.call(this, cipher.update(evalAndUnbox(block)));
}
exports.$encrypt = new rt.Box(encrypt);

// fromInts :: Tuple4 Int Int Int Int -> Block
function fromInts(ints) {
  var buf = Buffer.alloc(16);
  rt.evaluate(ints);
  ints = rt.smashIndirects(ints);
  for (var i = 0; i < 4; i++) {
    buf.writeInt32BE(evalAndUnbox(ints.fields[i]), i*4);
  }
  rt.Box.call(this, buf);
}
exports.$fromInts = new rt.Box(fromInts);

// toInts :: Block -> Tuple4 Int Int Int Int
function toInts(block) {
  var buf = evalAndUnbox(block);
  var a = new rt.Box(buf.readInt32BE(0));
  var b = new rt.Box(buf.readInt32BE(4));
  var c = new rt.Box(buf.readInt32BE(8));
  var d = new rt.Box(buf.readInt32BE(12));
  rt.Apply.call(this, tuple.$Tuple4, [a, b, c, d]);
}
exports.$toInts = new rt.Box(toInts);
