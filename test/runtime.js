var test = require('./lib/test');
var rt = require('humbaba/runtime');

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
  while (true) {
    rt.evaluate(head);
    if (head.tag === NIL)
      break;
    head = head.$t;
  }
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

tests = {

  evalData() {
    var x = new rt.Data(1);
    rt.evaluate(x);
    test.assertSame(new rt.Data(1), x);
  },

  applyEmptyNil() {
    var x = new rt.Apply(boxedEmpty, [new Nil()]);
    rt.evaluate(x);
    test.assertSame(new rt.Box(true), x);
  },

  applyEmptyCons() {
    var x = new rt.Apply(boxedEmpty, [new Cons(new Nil(), new Nil())]);
    rt.evaluate(x);
    test.assertSame(new rt.Box(false), x);
  },

  applyEmptyIndirectNil() {
    var x = new rt.Apply(boxedEmpty, [new rt.Indirect(new Nil())]);
    rt.evaluate(x);
    test.assertSame(new rt.Box(true), x);
  },

  applyEmptyIndirectIndirectNil() {
    var x = new rt.Apply(boxedEmpty, [new rt.Indirect(new rt.Indirect(new Nil()))]);
    rt.evaluate(x);
    test.assertSame(new rt.Box(true), x);
  },

  applyEmptyIndirectCons() {
    var x = new rt.Apply(boxedEmpty, [new rt.Indirect(new Cons(new Nil(), new Nil()))]);
    rt.evaluate(x);
    test.assertSame(new rt.Box(false), x);
  },

  applyExact() {
    // composeApply prepend1 prepend2 Nil
    var apply = new rt.Apply(boxedComposeApply, [prepend1, prepend2, nil]);
    forceList(apply);
    test.assertSame(arrayToList([1,2]), apply);
  },

  applyTooFew() {
    // (composeApply prepend1 prepend2) Nil
    var apply = new rt.Apply(boxedComposeApply, [prepend1, prepend2]);
    var apply2 = new rt.Apply(apply, [nil]);
    forceList(apply2);
    test.assertSame(arrayToList([1,2]), apply2);
  },

  applyTooMany() {
    // composeApply doubly doubly prepend1 Nil
    var apply = new rt.Apply(boxedComposeApply, [boxedDoubly, boxedDoubly, prepend1, nil]);
    forceList(apply);
    test.assertSame(arrayToList([1,1,1,1]), apply);
  },

  continuationArgDirect() {
    var thunk = new rt.Apply(boxedIdentity, [nil]);
    rt.evaluate(thunk);
    test.assertSame(indirect(1, nil), thunk);
  },

  continuationArgIndirect() {
    var thunk = new rt.Apply(boxedIdentity, [indirect(1, nil)]);
    rt.evaluate(thunk);
    test.assertSame(indirect(1, nil), thunk);
  },

  continuationArgIndirect2() {
    var thunk = new rt.Apply(boxedIdentity, [indirect(2, nil)]);
    rt.evaluate(thunk);
    test.assertSame(indirect(1, nil), thunk);
  },

  continuationThisIndirect() {
    var thunk = new rt.Indirect(new rt.Apply(boxedIdentity, [nil]));
    rt.evaluate(thunk);
    test.assertSame(indirect(1, nil), thunk);
  },

};

exports.tests = tests;

if (require.main === module)
  test.main(tests);
