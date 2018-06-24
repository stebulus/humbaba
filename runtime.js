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

function Data(tag, fields) {
  this.type = DATA;
  this.tag = tag;
  this.fields = fields;
}
Data.prototype = Node;
exports.Data = Data;

function PartialApply(func, args) {
  this.type = PARTIAL_APPLY;
  this.func = func;
  this.args = args;
}
PartialApply.prototype = Node;
exports.PartialApply = PartialApply;

function Indirect(target) {
  this.type = INDIRECT;
  this.target = target;
}
Indirect.prototype = Node;
exports.Indirect = Indirect;

function Thunk(evaluand, continuation) {
  this.type = THUNK;
  this.evaluand = evaluand;
  this.continuation = continuation;
}
Thunk.prototype = Node;
exports.Thunk = Thunk;

function Apply(func, args) {
  Thunk.call(this, func, applyTo(args));
}
Apply.prototype = Node;
exports.Apply = Apply;

function Box(value) {
  Data.call(this, 1, [value]);
}
Box.prototype = Node;
exports.Box = Box;

function applyTo(args) {
  return function(func) {
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

function setTarget(target) {
  this.target = target;
}

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
