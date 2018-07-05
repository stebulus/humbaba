/*
  Runtime support for Humbaba programs.

  A lazy evaluator using graph reduction.  There are four types of node:
  - DATA, representing values of algebraic data types;
  - PARTIAL_APPLY, a function with some arguments but not yet enough
    to actually call it;
  - INDIRECT, a pointer to another node;
  - THUNK, which contains an expression to be evaluated (to WHNF)
    and a continuation function which takes the result as an argument.

  When a THUNK is evaluated, it's overwritten with the result, which
  (usually) causes its type to change.  (This is why INDIRECT nodes
  are needed: to evaluate a THUNK to an existing node, we overwrite
  the THUNK with an INDIRECT to that existing node.)

  Calling convention:
  When a user-supplied JavaScript function is called to update
  the graph, it receives its arguments in the usual way, and its
  'this' refers to a graph node to be overwritten with the result.
  Any return value is ignored.

  We use the eval/apply method described in
    Peyton Jones, Simon.  How to make a fast curry: push/enter vs
    eval/apply.  2004.
    https://www.microsoft.com/en-us/research/publication/make-fast-curry-pushenter-vs-evalapply/
*/
var DATA = 1;
var PARTIAL_APPLY = 2;
var INDIRECT = 3;
var THUNK = 4;

function nodeType(node) {
  switch (node.type) {
    case DATA:
      return 'data(' + node.tag.toString() + ')';
    case PARTIAL_APPLY:
      return 'pap(' + node.func.name + ',' + node.args.length + ')';
    case INDIRECT:
      return '*' + nodeType(node.target);
    case THUNK:
      return 'thunk';
    default:
      return 'unknown';
  }
}
exports.nodeType = nodeType

var Node = {};
exports.Node = Node;

function Empty() {}
Empty.prototype = Node;
exports.Empty = Empty;

/*
  A graph node representing a value of an algebraic data type.

  tag is an integer representing which constructor is used.
  fields is an array (possibly empty) of expressions.
*/
function Data(tag, fields) {
  this.type = DATA;
  this.tag = tag;
  this.fields = fields;
}
Data.prototype = Node;
exports.Data = Data;

/*
  A graph node representing a function applied to some arguments
  (but not enough to actually call the function yet).

  func is a JavaScript function.  See "Calling convention" above.

  args is an array of arguments.  args.length < func.length.
*/
function PartialApply(func, args) {
  this.type = PARTIAL_APPLY;
  this.func = func;
  this.args = args;
}
PartialApply.prototype = Node;
exports.PartialApply = PartialApply;

/*
  A graph node pointing to another graph node.
*/
function Indirect(target) {
  this.type = INDIRECT;
  this.target = target;
}
Indirect.prototype = Node;
exports.Indirect = Indirect;

/*
  A graph node representing evaluation and inspection.

  evaluand is a graph node to be evaluated (to WHNF).

  continuation is a JavaScript function which takes the evaluated
  evaluand as its sole argument.  See "Calling convention" above.
*/
function Thunk(evaluand, continuation) {
  this.type = THUNK;
  this.evaluand = evaluand;
  this.continuation = continuation;
}
Thunk.prototype = Node;
exports.Thunk = Thunk;

/*
  A graph node representing a function applied to some arguments.

  func is a node representing a function.  It will first be evaluated;
  this must yield either a boxed function (that is, a DATA node with a
  single field, the JavaScript function) a partially applied function
  (that is, a PARTIAL_APPLY node), or an INDIRECT to one of those.

  args is an array of argument expressions.

  Implemented as a THUNK: we evaluate func and then apply it to
  the arguments.
*/
function Apply(func, args) {
  Thunk.call(this, func, applyTo(args));
}
Apply.prototype = Node;
exports.Apply = Apply;

/*
  A graph node representing a boxed JavaScript value.

  Implemented as a DATA.
*/
function Box(value) {
  Data.call(this, 1, [value]);
}
Box.prototype = Node;
exports.Box = Box;

/*
  The continuation for THUNKs representing function application.

  args is an array of argument expressions.
*/
function applyTo(args) {
  return function actuallyApply(func) {
    var allArgs;
    var unboxedFunc;
    switch (func.type) {
      case DATA:
        allArgs = args;
        unboxedFunc = func.fields[0];
        break;
      case PARTIAL_APPLY:
        allArgs = func.args.concat(args);
        unboxedFunc = func.func;
        break;
      case INDIRECT:
        throw new Error("evaluate() didn't smash indirects?");
      default:
        throw new Error("apply of non-function: " + func.type);
    }
    var desired = unboxedFunc.length;
    var present = allArgs.length;
    if (present < desired) {
      PartialApply.call(this, unboxedFunc, allArgs);
    } else if (present > desired) {
      var func2 = {}
      unboxedFunc.apply(func2, allArgs.slice(0, desired));
      Apply.call(this, func2, allArgs.slice(desired));
    } else {
      unboxedFunc.apply(this, allArgs);
    }
  }
}

/*
  Simplify chains of INDIRECT nodes.

  When passed the node INDIRECT 1, this function rewrites chains like
    INDIRECT 1 -> INDIRECT 2 -> INDIRECT 3 -> node
  to look like
    INDIRECT 1 -> node
    INDIRECT 2 -> node
    INDIRECT 3 -> node
  and returns node (so that the caller can update its own reference
  to INDIRECT 1).

  expr is a graph node.
*/
function smashIndirects(expr) {
  var indirects = [];
  var target;
  while (expr.target) {
    indirects.push(expr);
    target = expr.target;
    delete expr.target;
    expr = target;
  }
  for (var i = 0; i < indirects.length; i++)
    indirects[i].target = expr;
  return expr;
}
exports.smashIndirects = smashIndirects;

/*
  Continuation for completing the evaluation of INDIRECT nodes.
*/
function setTarget(target) {
  this.target = target;
}

/*
  Evaluate expr to WHNF.
*/
function evaluate(expr) {
  var stack = [];
  while (true) {
    switch (expr.type) {
      case DATA:
      case PARTIAL_APPLY:
        if (stack.length === 0)
          return;
        var oldexpr = smashIndirects(stack.pop());
        continuation = stack.pop();
        continuation.call(oldexpr, expr);
        expr = smashIndirects(oldexpr);
        break;
      case THUNK:
        if (expr.evaluand === undefined)
          throw new Error("thunk without evaluand -- infinite loop?");
        var evaluand = expr.evaluand;
        delete expr.evaluand;
        var continuation = expr.continuation;
        delete expr.continuation;
        stack.push(continuation);
        stack.push(expr);
        expr = evaluand;
        break;
      case INDIRECT:
        if (expr.target === undefined)
          throw new Error("indirect without target -- infinite loop?");
        var target = expr.target;
        delete expr.target;
        stack.push(setTarget);
        stack.push(expr);
        expr = target;
        break;
      default:
        throw new Error("unknown node type: " + expr.type);
    }
  }
}
exports.evaluate = evaluate;

function evaluateDeep(expr) {
  evaluate(expr);
  expr = smashIndirects(expr);
  if (expr.type === DATA) {
    for (var i = 0; i < expr.fields.length; i++) {
      if (expr.fields[i].type) {
        evaluateDeep(expr.fields[i]);
        expr.fields[i] = smashIndirects(expr.fields[i]);
      }
    }
  }
}
exports.evaluateDeep = evaluateDeep;

/*
  Algebraic data type representing IO actions.
*/
var IOPURE = 1;
exports.IOPURE = IOPURE;
var IOBIND = 2;
exports.IOBIND = IOBIND;
var PUTCHAR = 3;
exports.PUTCHAR = PUTCHAR;
var GETCHAR = 4;
exports.GETCHAR = GETCHAR;
var ISEOF = 5;
exports.ISEOF = ISEOF;

function IoPure(value) {
  Data.call(this, IOPURE, [value]);
}
IoPure.prototype = Node;
exports.IoPure = IoPure;

function IoBind(x, f) {
  Data.call(this, IOBIND, [x, f]);
}
IoBind.prototype = Node;
exports.IoBind = IoBind;

function PutChar(char) {
  Data.call(this, PUTCHAR, [char]);
}
PutChar.prototype = Node;
exports.PutChar = PutChar;

GetChar = new Data(GETCHAR, []);
exports.GetChar = GetChar;

IsEOF = new Data(ISEOF, []);
exports.IsEOF = IsEOF;

var TRUE = 1;
exports.TRUE = TRUE;
var FALSE = 2;
exports.FALSE = FALSE;

True = new Data(TRUE, []);
exports.True = True;
False = new Data(FALSE, []);
exports.False = False;

Unit = new Data(1, []);
exports.Unit = Unit;
