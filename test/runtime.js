var rt = require('../humbaba-runtime');
var t = require('tap');

var CONS = 1;
var NIL = 2;

function Cons(h, t) {
  rt.Data.call(this, CONS);
  this.$h = h;
  this.$t = t;
}
Cons.prototype = rt.Node;

function Nil() {
  rt.Data.call(this, NIL);
}
Nil.prototype = rt.Node;
var nil = new Nil();

function arrayToList(arr) {
  var head = new Nil();
  for (var i = arr.length - 1; i >= 0; i--)
    head = new Cons(new rt.Box(arr[i]), head);
  return head;
}

function forceList(head) {
  var orighead = head;
  while (true) {
    rt.evaluate(head);
    if (head.tag === NIL)
      break;
    head = head.$t;
  }
  return orighead;
}

function empty(x) {
  // empty x = case x of { Cons _ _ -> false; Nil -> true; }
  rt.Thunk.call(this, x, function (x) {
    switch (x.tag) {
      case CONS:
        rt.Box.call(this, false)
        break;
      case NIL:
        rt.Box.call(this, true)
        break;
      default:
        throw new Error("not a List tag: " + x.tag);
    }
  });
}
var boxedEmpty = new rt.Box(empty);

function indirect(n, value) {
  for (var i = 0; i < n; i++)
    value = new rt.Indirect(value);
  return value;
}

function identity(x) {
  rt.Indirect.call(this, x);
}
var boxedIdentity = new rt.Box(identity);

function prepend(value) {
  return function(expr) {
    Cons.call(this, new rt.Box(value), expr);
  };
}

function composeApply(x, y, z) {  // composeApply x y z = x (y z)
  var inner = new rt.Apply(y, [z]);
  rt.Apply.call(this, x, [inner]);
}
boxedComposeApply = new rt.Box(composeApply);
var prepend1 = new rt.Box(prepend(1));
var prepend2 = new rt.Box(prepend(2));

function doubly(f, x) {
  // doubly f x = composeApply f f x
  rt.Apply.call(this, boxedComposeApply, [f, f, x]);
}
var boxedDoubly = new rt.Box(doubly);

function evaluate(x) {
  rt.evaluate(x);
  return x;
}

t.strictSame(evaluate(new rt.Data(1)), new rt.Data(1), 'evaluate data');

t.strictSame(
  evaluate(new rt.Apply(boxedEmpty, [new Nil()])),
  new rt.Box(true),
  'apply empty Nil'
);

t.strictSame(
  evaluate(new rt.Apply(boxedEmpty, [new Cons(new Nil(), new Nil())])),
  new rt.Box(false),
  'apply empty Cons'
);

t.strictSame(
  evaluate(new rt.Apply(boxedEmpty, [new rt.Indirect(new Nil())])),
  new rt.Box(true),
  'apply empty indirect Nil'
);

t.strictSame(
  evaluate(new rt.Apply(boxedEmpty,
    [new rt.Indirect(new rt.Indirect(new Nil()))])),
  new rt.Box(true),
  'apply empty indirect indirect Nil'
);

t.strictSame(
  evaluate(new rt.Apply(boxedEmpty,
    [new rt.Indirect(new Cons(new Nil(), new Nil()))])),
  new rt.Box(false),
  'apply empty indirect Cons'
);

t.strictSame(
  // composeApply prepend1 prepend2 Nil
  forceList(new rt.Apply(boxedComposeApply, [prepend1, prepend2, nil])),
  arrayToList([1,2]),
  'apply exact'
);
  
t.strictSame(
  // (composeApply prepend1 prepend2) Nil
  forceList(new rt.Apply(new rt.Apply(boxedComposeApply, [prepend1, prepend2]), [nil])),
  arrayToList([1,2]),
  'apply too few'
);

t.strictSame(
  // composeApply doubly doubly prepend1 Nil
  forceList(new rt.Apply(boxedComposeApply, [boxedDoubly, boxedDoubly, prepend1, nil])),
  arrayToList([1,1,1,1]),
  'apply too many'
);

t.strictSame(
  evaluate(new rt.Apply(boxedIdentity, [nil])),
  indirect(1, nil),
  'continuation arg direct'
);

t.strictSame(
  evaluate(new rt.Apply(boxedIdentity, [indirect(1, nil)])),
  indirect(1, nil),
  'continuation arg indirect'
);

t.strictSame(
  evaluate(new rt.Apply(boxedIdentity, [indirect(2, nil)])),
  indirect(1, nil),
  'continuation arg indirect indirect'
);

t.strictSame(
  evaluate(new rt.Indirect(new rt.Apply(boxedIdentity, [nil]))),
  indirect(1, nil),
  'continuation arg this indirect'
);
