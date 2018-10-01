var evaluate = require('../../lib/evaluate');
var rt = require('../../../../runtime/humbaba-runtime');
var t = require('tap');

t.strictSame(evaluate.program({"declarations": [
  {"func": ["test"], "=": 3},
  {"comment": "three"}
]}), new rt.Box(3), 'ignore comment');

t.strictSame(evaluate.program({"declarations": [
  {"func": ["test"], "=": 4},
  {"comments": "four"}
]}), new rt.Box(4), 'ignore comments');
